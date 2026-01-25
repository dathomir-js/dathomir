#import "functions.typ": *
#import "settings.typ": apply-settings
#show: apply-settings

= SPEC.typ

== 目的

VNode ベースアーキテクチャから *SolidJS スタイルの Fine-grained Reactivity + Direct DOM* への全面移行。

TC39 Signals (alien-signals) を活用し、Compiler-First アプローチでどこよりも高速・軽量・独自性のあるフレームワークを構築する。

*破壊的変更度* : 100% (完全な書き直し)

*期待パフォーマンス向上* : 3-5x

*目標バンドルサイズ* : < 2KB (現在 3.08KB)


== Architecture Decision (2025-12-01)

*採用するアプローチ*: SolidJS ベースの Fine-grained Reactivity
- VNode システムを完全削除
- JSX → Direct DOM compilation
- Template cloning + createElement のハイブリッド戦略
- Compiler-assisted SSR state serialization

*独自性*:
1. TC39 Signals API (`.value` アクセス)
2. alien-signals (50% 高速)
3. 自動 Signal シリアライズ (SSR→CSR)
4. Web Components first-class support
5. Edge runtime 最適化
6. より明示的なコンパイル出力


== インターフェース仕様

#interface_spec(
  name: "SSR マーカープロトコル",
  summary: [
    SSR で生成した HTML を Hydration で再利用するためのマーカー仕様。
    *混在方式* を採用し、境界はコメント、要素は `data-*` 属性で表現する。
  ],
  format: [
    *コメントマーカー*（境界用）:
    - `<!--dh:t:ID-->`: 動的テキストノードの位置
    - `<!--dh:i:ID-->`: 子の挿入点（0/1/複数ノード）
    - `<!--dh:b:ID-->` ... `<!--/dh:b-->`: 制御フロー（if/each）の開始・終了

    *属性マーカー*（要素用、必要時のみ）:
    - `data-dh="ID"`: 要素への紐付け
    - `data-dh-hydrated`: Hydration 済みフラグ
  ],
  constraints: [
    - 基本は *コメント境界＋順序* で復元する
    - `data-*` は以下の場合のみ使用：
      - 復元が壊れやすい箇所の補強
      - 機能コンポーネントの適用先の明示
      - デバッグ可視化
    - SSR と CSR の出力順序が一致することが前提
  ],
  examples: [
    ```html
    <div>
      <!--dh:t:1-->Hello<!--dh:i:2-->
      <!--dh:b:3--><span>conditional</span><!--/dh:b-->
    </div>
    ```
  ],
)


== 振る舞い仕様

#behavior_spec(
  name: "Hydration",
  summary: [
    SSR で生成された DOM を再利用し、イベントとリアクティビティを接続する処理。
    Web Component が自分の ShadowRoot を担当する。
  ],
  preconditions: [
    - SSR で生成された HTML がブラウザに存在する
    - マーカー（コメント/属性）が正しく埋め込まれている
    - ShadowRoot は `open` モードである
    - 対象の ShadowRoot が未 Hydration である（WeakMap で管理）
  ],
  steps: [
    1. Hydration 対象の root（ShadowRoot）を特定
    2. WeakMap で Hydration 済みかチェック。済みならスキップ（冪等性保証）
    3. TreeWalker でコメントマーカーを線形走査
    4. 各マーカーに対して effect とイベントを *同時に* 接続：
      - `<!--dh:t:ID-->`: テキストノードの effect を接続
      - `<!--dh:i:ID-->`: 挿入点の effect を接続
      - `<!--dh:b:ID-->`: ブロックの effect + イベントを接続
    5. `data-dh` 属性がある要素にはイベント/属性バインディングを接続
    6. WeakMap に Hydration 済みとして登録
  ],
  postconditions: [
    - すべての動的箇所に effect/イベントが接続されている
    - Signal の更新が DOM に反映される状態になっている
    - 二重初期化が防止されている（WeakMap で管理）
  ],
  errors: [
    - *マーカー不一致*: 開発環境では例外、本番では警告 + CSR フォールバック
    - *ShadowRoot が closed*: Hydration 対象外、警告を出力
  ],
)

#behavior_spec(
  name: "Shadow DOM 生成戦略",
  summary: [
    Web Components の Shadow DOM を SSR → Hydration する際の生成方式。
    *Declarative Shadow DOM (DSD) を第一候補* とする。
  ],
  preconditions: [
    - Web Component が定義されている
    - SSR 環境で HTML を生成している
  ],
  steps: [
    1. SSR 時に `<template shadowrootmode="open">` を出力に含める
    2. ブラウザがDSD対応の場合: 自動的に ShadowRoot が生成される
    3. ブラウザがDSD非対応の場合:
      - クライアントで `attachShadow()` を呼び出す
      - template 内容を ShadowRoot に移動
      - Hydration を実行
  ],
  postconditions: [
    - ShadowRoot が存在し、内容が正しく構築されている
    - Hydration が完了している
  ],
  errors: [
    - *DSD 非対応環境*: フォールバック処理が実行される（初期表示が遅れる可能性）
  ],
)


== 決定の優先順位

以下の順序で設計の意思決定を進めることを推奨する。

1. *SSR → Hydration: マーカー方式/粒度/探索戦略*（全設計の前提）
  - Hydration 探索戦略

2. *SSR → Hydration: ミスマッチ方針/診断情報*（運用とDXの前提）
  - Hydration ミスマッチ方針
  - 診断情報の詳細度

3. *Runtime ↔ Transformer: 出力形（IR）とruntime原語*（実装量の上限を決める）
  - Transformer 出力形式
  - IR の安定性方針
  - Runtime 原語の最小セット

4. *イベントシステム: 直付け/委譲とcleanup契約*（APIとSSR互換に直結）
  - イベントシステム方針
  - イベントハンドラ表現
  - Cleanup 契約

5. *状態転送（SSR → CSR）: 何を/どこまで転送するか*（必要最小を決める）
  - 状態転送の範囲
  - 状態転送の注入形式
  - 状態転送のエスケープ規約
  - 状態転送の信頼境界


== ADR

#adr(
  header("SSR Hydration マーカー設計", Status.Accepted, "2026-01-19"),
  [
    SSR で生成した HTML を CSR で再利用（Hydration）するには、動的な箇所を特定するためのマーカーが必要。マーカーの方式と粒度を決定する必要がある。

    検討すべき観点：
    - DOM の汚染度（属性 vs コメント）
    - 探索コスト（線形走査 vs 直接参照）
    - テキストノードや挿入点の表現（属性では不可）
    - デバッグ容易性
  ],
  [
    *混在方式* を採用する。

    - 境界（挿入点・ブロック・テキスト）: HTMLコメント
    - 要素への紐付け: `data-*` 属性（必要時のみ）

    基本は *コメント境界＋順序* で復元する。`data-*` は以下の場合のみ使用：
    - 復元が壊れやすい箇所の補強
    - 機能コンポーネントの適用先の明示
    - デバッグ可視化
  ],
  [
    - コメントで境界を表現することで、テキストノードや挿入点も統一的に扱える
    - `data-*` を原則使わないことで、本番 HTML がクリーンに保たれる
    - 順序ベースの復元は、DOM 構造の変更に弱い（SSR/CSR の出力が一致する前提）
  ],
  alternatives: [
    1. *コメントのみ*: DOM がクリーンだが、要素への直接参照ができない
    2. *`data-*` のみ*: テキストノードや挿入点の表現が困難
    3. *混在（常時 `data-*`）*: DOM が汚れる、本番で不要な情報が残る
  ],
  references: (
    link("https://github.com/solidjs/solid")[SolidJS - Hydration 実装],
    link("https://svelte.dev/docs/svelte/svelte-compiler")[Svelte - claim による DOM 再利用],
  ),
)

#adr(
  header("Shadow DOM Hydration スコープ", Status.Accepted, "2026-01-19"),
  [
    Web Components の Shadow DOM を SSR → Hydration する際、どの範囲を対象にするか、どの API を使うかを決定する必要がある。

    検討すべき観点：
    - `open` vs `closed` ShadowRoot のアクセス可否
    - Declarative Shadow DOM (DSD) のブラウザ対応状況
    - SSR 出力に Shadow DOM 内容を含められるか
  ],
  [
    - *ShadowRoot は `open` のみ対象* とする
    - *Declarative Shadow DOM (DSD) を第一候補* とする
    - 非対応環境は `attachShadow()` → DOM 構築 → Hydration にフォールバック
  ],
  [
    - `open` 限定により、外部から `el.shadowRoot` で走査可能
    - DSD により、SSR で Shadow DOM 内容を HTML に含められる
    - 非対応ブラウザではフォールバックが必要（初期表示が遅れる可能性）
    - `closed` な Shadow DOM は Hydration 対象外となる
  ],
  alternatives: [
    1. *DSD なし（クライアント生成のみ）*: SSR の恩恵が Shadow 内に及ばない
    2. *`closed` も対象*: 外部からアクセス不可、参照確保タイミングが複雑化
  ],
  references: (
    link("https://developer.chrome.com/docs/css-ui/declarative-shadow-dom")[Declarative Shadow DOM - Chrome Developers],
  ),
)

#adr(
  header("Web Component の Hydration 責務", Status.Accepted, "2026-01-19"),
  [
    Hydration を「誰が」実行するかを決定する必要がある。アプリ全体の `hydrate()` が一括で行うか、各 Web Component が自分の ShadowRoot を担当するか。

    検討すべき観点：
    - Web Component を外部フレームワーク（React/Vue）でも使いたい
    - 二重初期化の防止
    - パフォーマンス（一括 vs 個別）
  ],
  [
    *Web Component が自分の ShadowRoot を担当* する。

    - 各 WC は `connectedCallback` 等で自身の `shadowRoot` を Hydration
    - アプリ全体の `hydrate()` は補助的な役割（呼ぶだけ/一括最適化用）
    - 二重初期化は検出してスキップ（冪等性を保証）
  ],
  [
    - React/Vue 等から使っても、WC 単体で Hydration が完結する
    - Dathomir アプリでは全体 `hydrate()` による一括最適化も可能
    - 冪等性の保証が必須（`data-dh-hydrated` 等のフラグで管理）
    - WC ごとに Hydration ロジックを持つため、コードが分散する
  ],
  alternatives: [
    1. *アプリ全体の `hydrate()` が一括管理*: 外部 FW から使う場合に機能しない
    2. *完全に分離（WC は独自実装）*: Dathomir の恩恵が Shadow 内に及ばない
  ],
  references: (),
)

#adr(
  header("Hydration 探索戦略", Status.Accepted, "2026-01-25"),
  [
    Hydration 時に SSR マーカーをどのように探索するかを決定する必要がある。

    検討すべき観点：
    - 探索コスト（線形 vs 直接参照）
    - 実装複雑性
    - ミスマッチ時の検出容易性
  ],
  [
    *TreeWalker による線形探索* を採用する。

    - `document.createTreeWalker()` でコメントノードを順番に走査
    - マーカーの種類（text/insert/block）に応じて処理を分岐
    - 探索範囲は ShadowRoot 単位で自然に分離される
  ],
  [
    - O(n) だが、Web Component 分割により各 ShadowRoot は数十〜数百ノード程度
    - TreeWalker はブラウザのネイティブ API で高度に最適化されている
    - SolidJS・Svelte と同様のアプローチで実績あり
    - シンプルで実装・デバッグが容易
  ],
  alternatives: [
    1. *key で直接参照*: `data-dh="ID"` で要素を特定。O(1) だが HTML が汚れる、ID 管理が複雑
    2. *境界スコープ化*: ブロック単位で探索範囲を限定。実装が複雑
  ],
  references: (
    link(
      "https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/internal/client/dom/hydration.js",
    )[Svelte - hydration.js],
  ),
)

#adr(
  header("Hydration の冪等性保証", Status.Accepted, "2026-01-25"),
  [
    二重初期化を検出して安全にスキップできる仕組みが必要。

    検討すべき観点：
    - フラグの管理方法（DOM 属性 vs メモリ）
    - スコープ（要素単位 / ShadowRoot 単位）
    - 性能への影響
  ],
  [
    *WeakMap による ShadowRoot 単位の管理* を採用する。

    ```typescript
    const hydratedRoots = new WeakMap<ShadowRoot, true>();

    function hydrate(root: ShadowRoot) {
      if (hydratedRoots.has(root)) return; // 二重初期化防止
      hydratedRoots.set(root, true);
      // ... Hydration 処理 ...
    }
    ```
  ],
  [
    - 本番 HTML がクリーンに保たれる（`data-dh-hydrated` 属性不要）
    - ShadowRoot が GC されると自動的にエントリも削除される
    - 要素単位の管理は不要（ShadowRoot 単位で十分）
  ],
  alternatives: [
    1. *`data-dh-hydrated` 属性*: DOM 上で可視、デバッグ容易だが HTML が汚れる
    2. *ハイブリッド*: 本番=WeakMap、開発=属性。環境差異が生じる
  ],
  references: (),
)

#adr(
  header("Hydration ミスマッチ方針", Status.Accepted, "2026-01-25"),
  [
    SSR と CSR の出力が一致しない場合の対処方針を決定する必要がある。

    検討すべき観点：
    - 開発体験（早期発見）
    - 本番環境の安定性
    - 復旧可能性
  ],
  [
    *環境別の方針* を採用する。

    - *開発環境（`__DEV__`）*: 例外を投げて停止。バグを早期発見。
    - *本番環境*: 警告をコンソールに出力し、CSR フォールバックを試みる。

    Svelte の `recover` オプションと同様のアプローチ。
  ],
  [
    - 開発時は厳格にバグを発見できる
    - 本番では安定性を優先し、ユーザー体験を損なわない
    - 警告により問題の存在は把握できる
  ],
  alternatives: [
    1. *常に例外*: 本番で脆い
    2. *常にフォールバック*: 開発時に問題が隠れる
  ],
  references: (
    link(
      "https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/internal/client/render.js",
    )[Svelte - render.js hydrate()],
  ),
)

#adr(
  header("Hydration 初期化順序", Status.Accepted, "2026-01-25"),
  [
    イベント復元と effect 接続をどの順序で行うかを決定する必要がある。

    検討すべき観点：
    - ユーザーインタラクションの即応性
    - 初期レンダリングの正確性
    - 競合条件の回避
  ],
  [
    *走査中に同時接続* を採用する。

    マーカーの走査と接続を分離せず、各ノードに対して effect とイベントを同時に接続する。

    ```typescript
    function hydrate(root: ShadowRoot) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
      while (walker.nextNode()) {
        const marker = walker.currentNode;
        // マーカーの種類に応じて effect とイベントを両方接続
        connectEffects(marker);
        connectEvents(marker);
      }
    }
    ```
  ],
  [
    - 順序問題を回避できる（イベント発火時に effect が未接続という状態が発生しない）
    - SolidJS・Svelte と同様のアプローチで実績あり
    - 実装がシンプル
  ],
  alternatives: [
    1. *イベント復元 → effect 接続*: イベント発火時に状態不整合が発生するリスク
    2. *effect 接続 → イベント復元*: 安全だがユーザー操作が無視される期間が生じる
    3. *イベントキューイング*: 実装が複雑、遅延実行による予期しない挙動のリスク
  ],
  references: (),
)

#adr(
  header("状態転送の範囲", Status.Proposed, "2026-01-25"),
  [
    SSR → CSR で何をどこまで転送するかを決定する必要がある。

    検討すべき観点：
    - 転送量（HTML サイズへの影響）
    - 再現性（完全に同じ状態になるか）
    - セキュリティ（何を露出するか）
  ],
  [
    未決定。以下の選択肢を検討中：
    - なし（再実行のみ）
    - 初期値のみ
    - Signal ID + 初期値
    - スナップショット（派生値含む）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("状態転送の注入形式", Status.Proposed, "2026-01-25"),
  [
    転送された状態をどのようにクライアントに渡すかを決定する必要がある。

    検討すべき観点：
    - パースコスト
    - CSP 互換性
    - コード分割との相性
  ],
  [
    未決定。以下の選択肢を検討中：
    - `window.__DATHOMIR_STATE__`（グローバル汚染）
    - `<script type="application/json">`（CSP 安全）
    - 分割（chunk ごと）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("状態転送のエスケープ規約", Status.Proposed, "2026-01-25"),
  [
    状態を文字列化・復元する際の XSS 対策を決定する必要がある。

    検討すべき観点：
    - セキュリティ（XSS 防止）
    - 対応型（文字列、数値、オブジェクト、循環参照）
    - 性能（シリアライズコスト）
  ],
  [
    未決定。検討事項：
    - JSON.stringify の使用可否
    - カスタムシリアライザの必要性
    - 循環参照の扱い
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("状態転送の信頼境界", Status.Proposed, "2026-01-25"),
  [
    サーバ生成データの取り扱いと改ざん耐性の要否を決定する必要がある。

    検討すべき観点：
    - セキュリティモデル
    - 署名/検証の必要性
    - 性能への影響
  ],
  [
    未決定。検討事項：
    - サーバデータを信頼するか検証するか
    - 改ざん検出が必要か
    - どのレベルのセキュリティを目指すか
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Transformer 出力形式", Status.Proposed, "2026-01-25"),
  [
    transformer が生成するコードの形式を決定する必要がある。

    検討すべき観点：
    - transformer の実装量
    - runtime の複雑性
    - 最適化の余地
  ],
  [
    未決定。以下の選択肢を検討中：
    - DOM 生成コード中心（transformer が複雑）
    - テンプレ + 操作テーブル（IR）中心（runtime が複雑）
    - ハイブリッド（バランス型）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("IR の安定性方針", Status.Proposed, "2026-01-25"),
  [
    内部表現（IR）のバージョン管理方針を決定する必要がある。

    検討すべき観点：
    - 破壊的変更の頻度
    - ビルドキャッシュの互換性
    - 開発速度 vs 安定性
  ],
  [
    未決定。以下の選択肢を検討中：
    - 内部専用（破壊変更 OK）
    - セマンティックバージョンで管理
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Runtime 原語の最小セット", Status.Proposed, "2026-01-25"),
  [
    runtime が提供する基本操作（原語）の最小セットを決定する必要がある。

    検討すべき観点：
    - transformer の実装量
    - runtime のバンドルサイズ
    - 拡張性
  ],
  [
    未決定。候補：
    - `template`: テンプレートクローン
    - `insert`: ノード挿入
    - `setAttr` / `setProp`: 属性/プロパティ設定
    - `addEvent`: イベントリスナー追加

    どこまでを必須にするか検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("イベントシステム方針", Status.Proposed, "2026-01-25"),
  [
    イベントリスナーを直接付けるか、委譲するかを決定する必要がある。

    検討すべき観点：
    - 性能（イベント数が多い場合）
    - メモリ使用量
    - SSR 互換性
  ],
  [
    未決定。以下の選択肢を検討中：
    - 直付け（シンプル）
    - 委譲（常時）（メモリ効率）
    - 委譲（オプトイン）（柔軟）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("イベントハンドラ表現", Status.Proposed, "2026-01-25"),
  [
    ハンドラをどう表現するかを決定する必要がある。

    検討すべき観点：
    - SSR 互換性
    - Hydration の容易性
    - セキュリティ
  ],
  [
    未決定。以下の選択肢を検討中：
    - 関数参照（直接的だが SSR 困難）
    - ID 参照（SSR 互換性高い）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Cleanup 契約", Status.Proposed, "2026-01-25"),
  [
    effect / event / timer 等の解除責務とスコープ単位を決定する必要がある。

    検討すべき観点：
    - メモリリーク防止
    - コンポーネント境界との関係
    - API の明瞭性
  ],
  [
    未決定。検討事項：
    - 誰が cleanup を呼ぶか
    - スコープ単位（コンポーネント / effect / グローバル）
    - 自動 vs 手動
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("コンポーネント境界の意味論", Status.Proposed, "2026-01-25"),
  [
    コンポーネントが cleanup スコープを持つかを決定する必要がある。

    検討すべき観点：
    - メモリ管理の単位
    - 再利用性
    - アンマウント時の挙動
  ],
  [
    未決定。以下の選択肢を検討中：
    - cleanup スコープを持つ（自動管理）
    - 持たない（手動管理）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Fragment/制御フローの境界表現", Status.Proposed, "2026-01-25"),
  [
    Fragment / if / each の境界をどう表現するかを決定する必要がある。

    検討すべき観点：
    - Hydration の容易性
    - 差分更新の効率
    - keyed list の要件
  ],
  [
    未決定。検討事項：
    - コメント境界は必須か
    - keyed list の実装方法
    - 範囲の特定方法
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("更新単位の責務分担", Status.Proposed, "2026-01-25"),
  [
    テキスト / 属性 / リスト差分の責務を runtime と transformer のどちらが持つかを決定する必要がある。

    検討すべき観点：
    - transformer の実装量
    - runtime のバンドルサイズ
    - 最適化の余地
  ],
  [
    未決定。責務分担の境界線を検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Effect スケジューリング", Status.Proposed, "2026-01-25"),
  [
    effect の実行タイミングを決定する必要がある。

    検討すべき観点：
    - 更新の即時性 vs バッチング
    - 性能
    - 他のライブラリとの互換性
  ],
  [
    未決定。以下の選択肢を検討中：
    - 同期（即時）
    - microtask（非同期だが早い）
    - batched flush（効率的）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("公開 API の範囲", Status.Proposed, "2026-01-25"),
  [
    `memo` / `untrack` / `cleanup` 等を公開 API に含めるかを決定する必要がある。

    検討すべき観点：
    - 開発者体験
    - API サーフェスの大きさ
    - 互換性コスト
  ],
  [
    未決定。どこまで公開するか検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("値読み取りの規約", Status.Proposed, "2026-01-25"),
  [
    Signal の値を `.value` で読むか、アクセサ関数も許容するかを決定する必要がある。

    検討すべき観点：
    - TC39 Signals 仕様との整合性
    - 開発者体験
    - 型安全性
  ],
  [
    未決定。以下の選択肢を検討中：
    - `.value` 固定（TC39 準拠）
    - アクセサ関数も許容（柔軟）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("SSR 対象の範囲", Status.Proposed, "2026-01-25"),
  [
    文字列 SSR のみか、サーバ DOM 生成も視野に入れるかを決定する必要がある。

    検討すべき観点：
    - 実装複雑性
    - Edge 環境での動作
    - 性能
  ],
  [
    未決定。以下の選択肢を検討中：
    - 文字列 SSR のみ（シンプル）
    - サーバ DOM 生成も視野に入れる（将来拡張）
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Edge 環境の制約", Status.Proposed, "2026-01-25"),
  [
    Node 依存ゼロをいつから前提にするかを決定する必要がある。

    検討すべき観点：
    - 対応環境の広さ
    - 実装の制約
    - タイムライン
  ],
  [
    未決定。v1 から Node ゼロか、段階的移行か検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("Web Components 属性/プロパティのリフレクション", Status.Proposed, "2026-01-25"),
  [
    属性とプロパティの同期方法を決定する必要がある。

    検討すべき観点：
    - Web Components 標準との整合性
    - リアクティビティとの統合
    - 性能
  ],
  [
    未決定。リフレクション規約を検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("診断情報の詳細度", Status.Proposed, "2026-01-25"),
  [
    ミスマッチ時にどこまで情報を出すかを決定する必要がある。

    検討すべき観点：
    - デバッグ容易性
    - 本番環境での情報漏洩
    - バンドルサイズ
  ],
  [
    未決定。以下を含めるか検討中：
    - 境界の位置
    - 期待値 vs 実際値
    - マーカー情報
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)

#adr(
  header("SSR モード伝播", Status.Proposed, "2026-01-25"),
  [
    plugin / transformer に SSR モードフラグをどう渡すかを決定する必要がある。

    検討すべき観点：
    - ビルドツールとの統合
    - 環境変数 vs 設定ファイル
    - 誤設定の防止
  ],
  [
    未決定。伝播方法を検討中。
  ],
  [
    未定
  ],
  alternatives: [],
  references: (),
)
