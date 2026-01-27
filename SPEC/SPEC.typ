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
- 構造化配列方式（Svelte 5 の `from_tree` アプローチを参考）
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
    - `data-dh-hydrated`: Hydration 済みフラグ（*開発モードのみ*、本番では WeakMap で管理）
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

#interface_spec(
  name: "構造化配列形式（IR）",
  summary: [
    Transformer が生成し、Runtime が消費する中間表現（IR）の形式。
    DOM 構造を配列で表現し、静的部分と動的部分を明確に分離する。
  ],
  format: [
    *基本形式*: `[tag, attrs, ...children]`
    - `tag`: 要素名（文字列）
    - `attrs`: 属性オブジェクト または `null`
    - `children`: 文字列（静的テキスト）または ネストした配列

    *プレースホルダー*（動的箇所）:
    - `['\{text\}', null]`: 動的テキストノードの位置
    - `['\{insert\}', null]`: 子の挿入点（0/1/複数ノード）
    - `['\{each\}', null]`: リストの挿入点

    *flags*（第2引数）:
    - `1`: SVG 名前空間
    - `2`: MathML 名前空間
    - `0`: HTML（デフォルト）
  ],
  constraints: [
    - 配列は不変（イミュータブル）として扱う
    - プレースホルダーは必ず `['\{type\}', null]` 形式
    - IR のバージョンは Transformer と Runtime で厳密に一致すること
  ],
  examples: [
    ```javascript
    // JSX: <button class="btn">Count: {count}</button>
    // 構造化配列:
    ['button', \{ class: 'btn' \}, 'Count: ', ['\{text\}', null]]

    // JSX: <ul>{items.map(item => <li>{item}</li>)}</ul>
    // 構造化配列:
    ['ul', null, ['\{each\}', null]]
    ```
  ],
)

#interface_spec(
  name: "Runtime API",
  summary: [
    Runtime が提供する 14 個の関数の署名と契約。
    Compiler-First 哲学に基づき、最小限の関数セットで構成される。
  ],
  format: [
    *DOM 生成*:
    - `fromTree(structure: Tree, flags?: number): DocumentFragment`
    - `firstChild(node: Node, isText?: boolean): Node`
    - `nextSibling(node: Node): Node`

    *DOM 操作*:
    - `setText(node: Text, value: string): void`
    - `setAttr(element: Element, name: string, value: any): void`
    - `setProp(element: Element, name: string, value: any): void`
    - `spread(element: Element, prev: object | null, next: object): object`
    - `append(parent: Node, child: Node): void`
    - `insert(parent: Node, child: Node, anchor: Node | null): void`

    *リスト*:
    - `reconcile(parent: Node, items: T[], keyFn: (item: T) => any, createFn: (item: T) => Node): void`

    *リアクティビティ*:
    - `templateEffect(fn: () => void): void`
    - `createRoot(fn: () => void): () => void`

    *イベント*:
    - `event(type: string, element: Element, handler: EventListener): void`
  ],
  constraints: [
    - `spread` は前回の props を返し、次回の呼び出しで差分更新に使用
    - `createRoot` は dispose 関数を返す
    - `templateEffect` 内の effect は `createRoot` のスコープに自動登録
    - `event` で登録したリスナーは `createRoot` の dispose で自動解除
  ],
  examples: [
    ```javascript
    // Transformer が生成するコード例
    const _t1 = fromTree([['button', null, 'Count: ', ['\{text\}', null]]], 0);

    class MyCounter extends HTMLElement \{
      #dispose;
      connectedCallback() \{
        this.#dispose = createRoot(() => \{
          const fragment = _t1();
          const button = firstChild(fragment);
          const text = firstChild(button, true);
          templateEffect(() => setText(text, this.count.value));
          event('click', button, () => this.count.value++);
          this.shadowRoot.append(fragment);
        \});
      \}
      disconnectedCallback() \{ this.#dispose?.(); \}
    \}
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
    3. `createRoot()` で cleanup スコープを作成
    4. TreeWalker でコメントマーカーを線形走査
    5. 各マーカーに対して effect とイベントを *同時に* 接続：
      - `<!--dh:t:ID-->`: テキストノードの effect を接続
      - `<!--dh:i:ID-->`: 挿入点の effect を接続
      - `<!--dh:b:ID-->`: ブロックの effect + イベントを接続
    6. `data-dh` 属性がある要素にはイベント/属性バインディングを接続
    7. WeakMap に Hydration 済みとして登録
    8. `createRoot()` の dispose 関数を Web Component に保存
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

#behavior_spec(
  name: "Cleanup ライフサイクル",
  summary: [
    `createRoot` によるリソース管理とコンポーネントのライフサイクル統合。
    Owner/Root ベースの自動 cleanup を実現する。
  ],
  preconditions: [
    - Web Component が定義されている
    - `connectedCallback` が呼び出された
  ],
  steps: [
    1. `connectedCallback` で `createRoot(fn)` を呼び出す
    2. `createRoot` は現在の「オーナー」をスタックにプッシュ
    3. `fn` 内で呼ばれた `templateEffect` / `event` は自動的にオーナーに登録
    4. `fn` 実行完了後、オーナーをスタックからポップ
    5. `createRoot` は `dispose` 関数を返す
    6. `disconnectedCallback` で `dispose()` を呼び出す
    7. `dispose` は登録された全ての effect を停止し、イベントリスナーを解除
  ],
  postconditions: [
    - 全ての effect が停止している
    - 全てのイベントリスナーが解除されている
    - メモリリークが発生しない
  ],
  errors: [
    - *dispose 呼び忘れ*: メモリリークが発生（開発モードで警告を検討）
  ],
)

#behavior_spec(
  name: "Effect 実行",
  summary: [
    Signal 更新から DOM 更新までのリアクティブな実行フロー。
    batched flush により効率的な更新を実現する。
  ],
  preconditions: [
    - `templateEffect` で effect が登録されている
    - effect 内で Signal の `.value` が読み取られている
  ],
  steps: [
    1. Signal の `.value` に新しい値を代入
    2. Signal は依存する effect を「ダーティ」としてマーク
    3. `batch()` 内の場合: batch 終了まで実行を遅延
    4. `batch()` 外の場合: 同期的に effect を実行
    5. effect 内の DOM 操作（`setText`, `setAttr` 等）が実行される
    6. DOM が更新される
  ],
  postconditions: [
    - 全てのダーティな effect が実行されている
    - DOM が最新の Signal 値を反映している
    - 同じ effect は1回のフラッシュで1度だけ実行される
  ],
  errors: [
    - *無限ループ*: effect 内で自身の依存 Signal を更新すると発生（開発モードで検出・警告）
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
    - 冪等性の保証が必須（WeakMap で管理）
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
  header("Transformer 出力形式", Status.Accepted, "2026-01-26"),
  [
    transformer が生成するコードの形式を決定する必要がある。

    検討すべき観点：
    - transformer の実装量
    - runtime の複雑性
    - 最適化の余地
    - 独自性と将来の拡張性
    - バンドルサイズ（目標 < 2KB）
  ],
  [
    *構造化配列方式* を採用する。

    Svelte 5 の `from_tree` アプローチを参考に、DOM 構造を配列で表現する。

    構造化配列の形式：
    - `[tag, attrs, ...children]`
    - `tag`: 要素名（文字列）
    - `attrs`: 属性オブジェクト（`null` の場合もある）
    - `children`: 文字列 または ネストした配列
    - 動的箇所は `\{text\}`, `\{insert\}` などのプレースホルダーで表現

    Transformer 出力例：
    - `fromTree([['button', \{ class: 'btn' \}, 'Count: ', ['\{text\}', null]]], 1)`
    - `firstChild(fragment)` でボタン要素を取得
    - `templateEffect(() => setText(text, count.value))` でリアクティブ更新
  ],
  [
    *利点*:
    - 型安全: TypeScript で構造を厳密に検証可能
    - 拡張性: Compiler が構造を完全に理解し、高度な最適化が可能
    - デバッグ容易性: 構造が明確で可視化しやすい
    - 独自性: Dathomir の特徴として打ち出せる（先進的アプローチ）
    - Compiler 制御: 静的/動的の完全な分離、特殊化が容易

    *欠点*:
    - 実績が少ない: Svelte 5 では実験的機能
    - Runtime 実装: HTML パーサーではなく独自実装が必要
    - 初期パフォーマンス: ブラウザ最適化の恩恵を受けにくい可能性
  ],
  alternatives: [
    1. *HTML String 方式* (Svelte 5 デフォルト): `fromHtml()` 形式。ブラウザの HTML パーサーを活用し、実績あり（1-2KB 達成済み）。もし構造化配列方式でパフォーマンスや実装の問題が発生した場合の有力な代替案。
    2. *Template String 方式* (SolidJS 型): `template()` + 多数の runtime helpers。バンドルサイズ 6-7KB で目標を超過するため不採用。
  ],
  references: (
    link("https://svelte.dev/docs/svelte/svelte-compiler")[Svelte 5 - from_tree (experimental)],
  ),
)

#adr(
  header("IR の安定性方針", Status.Accepted, "2026-01-26"),
  [
    内部表現（IR）のバージョン管理方針を決定する必要がある。

    検討すべき観点：
    - 破壊的変更の頻度
    - ビルドキャッシュの互換性
    - 開発速度 vs 安定性
  ],
  [
    *内部専用（破壊変更 OK）* を採用する。

    - v1.0 までは IR（構造化配列形式）の破壊的変更を許容
    - `@dathomir/transformer` と `@dathomir/runtime` のバージョンを厳密に紐付け（peerDependencies）
    - ユーザーは手書きしない（Transformer が生成）ため、影響は限定的
  ],
  [
    - 開発速度を優先し、最適化を試行錯誤できる
    - 互換性負債を回避し、将来の改善余地を確保
    - v1.0 以降は semver で管理し、メジャーバージョンでのみ破壊変更
    - ビルドキャッシュは transformer と runtime のバージョン組み合わせで管理
  ],
  alternatives: [
    1. *初期から semver 管理*: 安定性は高いが、v1.0 前の最適化が制約される
  ],
  references: (),
)

#adr(
  header("Runtime 原語の最小セット", Status.Accepted, "2026-01-27"),
  [
    runtime が提供する基本操作（原語）の最小セットを決定する必要がある。

    検討すべき観点：
    - 構造化配列方式（`fromTree`）の実装要件
    - バンドルサイズ（目標 < 2KB）
    - SSR/CSR 両対応
    - Hydration 互換性
    - Cleanup 契約（Owner/Root ベース）との整合性
    - リスト差分の責務
  ],
  [
    *最小セット* を以下に定める。

    *DOM 生成*:
    - `fromTree(structure, flags)`: 構造化配列から DOM を生成
    - `firstChild(node, isText?)`: 最初の子ノードを取得
    - `nextSibling(node)`: 次の兄弟ノードを取得

    *DOM 操作*:
    - `setText(node, value)`: テキストノードの内容を設定
    - `setAttr(element, name, value)`: 属性を設定
    - `setProp(element, name, value)`: プロパティを設定
    - `spread(element, prevProps, nextProps)`: 複数属性を一括設定（差分更新対応）
    - `append(parent, child)`: 子ノードを追加
    - `insert(parent, child, anchor)`: 指定位置に挿入

    *リスト*:
    - `reconcile(parent, items, keyFn, createFn)`: keyed list の差分更新

    *リアクティビティ*:
    - `templateEffect(fn)`: テンプレート用 effect（再実行可能）
    - `createRoot(fn)`: cleanup スコープを作成し、dispose 関数を返す

    *イベント*:
    - `event(type, element, handler)`: イベントリスナーを追加

    合計: *14 関数*（推定 ~1.6KB、目標 2KB 以内）
  ],
  [
    - Cleanup 契約（Owner/Root ベース）のため `createRoot` を追加
    - リスト差分を Runtime に集約することで、出力コードを簡潔に保つ
    - `spread` を追加し、`\{...props\}` の差分更新をサポート
    - `fromTree` が中核となり、他は補助的な操作のみ
    - Compiler が複雑さを担当し、Runtime はシンプルに保つ
    - `templateEffect` は alien-signals の `effect` をラップし、バッチング制御を追加

    *バンドルサイズ推定*:
    - DOM 生成/操作: ~580B
    - spread: ~150B
    - reconcile: ~400B
    - templateEffect + createRoot: ~350B
    - event: ~50B
    - 合計: ~1.6KB（目標 2KB 以内、マージン ~400B）
  ],
  alternatives: [
    1. *reconcile を Compiler 展開*: 出力コードが肥大化し、重複が発生するため不採用
    2. *createRoot なし*: Cleanup 契約と整合しないため不採用
  ],
  references: (
    link("https://svelte.dev/docs/svelte/svelte-internal")[Svelte 5 - Internal runtime],
  ),
)

#adr(
  header("イベントシステム方針", Status.Accepted, "2026-01-26"),
  [
    イベントリスナーを直接付けるか、委譲するかを決定する必要がある。

    検討すべき観点：
    - 性能（イベント数が多い場合）
    - メモリ使用量
    - SSR 互換性
    - バンドルサイズ（目標 < 2KB）
  ],
  [
    *直付け（addEventListener）* を採用する。

    - `event(type, element, handler)` で要素に直接リスナーを追加
    - 委譲システムは実装しない（v1.0）
    - Hydration 時は関数参照を直接復元
  ],
  [
    - シンプルで実装コストが低い、バンドルサイズへの影響が最小
    - SSR 互換性が高い（Hydration で関数参照を復元するだけ）
    - Web Components パターンでは各コンポーネントが小規模のため、委譲の恩恵が少ない
    - バブリングしないイベント（focus, blur 等）も統一的に扱える
    - 委譲システムは 500B-1KB 必要で、目標 2KB に対して大きい
  ],
  alternatives: [
    1. *委譲（SolidJS 型）*: メモリ効率的だが、SSR で `$$click` プロパティの復元が必要。バンドルサイズ増加。
    2. *委譲（オプトイン）*: 柔軟だが実装が複雑。v2 で検討可能。
  ],
  references: (),
)

#adr(
  header("イベントハンドラ表現", Status.Accepted, "2026-01-26"),
  [
    ハンドラをどう表現するかを決定する必要がある。

    検討すべき観点：
    - SSR 互換性
    - Hydration の容易性
    - セキュリティ
    - イベントシステム方針（直付け）との整合性
  ],
  [
    *関数参照（直接）* を採用する。

    - CSR: `event('click', button, () => count.value++)` で関数を直接渡す
    - SSR → Hydration: マーカーと関数の紐付け情報を管理し、Hydration 時に復元
    - ID 参照は不要（委譲システムがないため）
  ],
  [
    - 直付けイベントシステムと整合性がある
    - シンプルで理解しやすい
    - SSR では Hydration マーカーと関数の対応関係を保持する必要がある
    - セキュリティ: 関数は Transformer が生成するコード内に埋め込まれる
  ],
  alternatives: [
    1. *ID 参照*: `event('click', button, 'handler_1')` 形式。委譲システムで有用だが、直付けでは不要な複雑性。
  ],
  references: (),
)

#adr(
  header("Cleanup 契約", Status.Accepted, "2026-01-27"),
  [
    effect / event / timer 等の解除責務とスコープ単位を決定する必要がある。

    検討すべき観点：
    - メモリリーク防止
    - コンポーネント境界との関係
    - API の明瞭性
    - バンドルサイズ
  ],
  [
    *Owner/Root ベース（SolidJS 型）* を採用する。

    - `createRoot(fn)` で cleanup スコープを作成
    - スコープ内の effect/event は自動的に追跡される
    - `createRoot()` は dispose 関数を返し、呼び出すと全て cleanup
    - Web Component の `disconnectedCallback` で dispose を呼ぶ

    実装イメージ：
    ```typescript
    class MyCounter extends HTMLElement \{
      #dispose;

      connectedCallback() \{
        this.#dispose = createRoot(() => \{
          // このスコープ内の effect/event は自動追跡
          templateEffect(() => setText(text, count.value));
          event('click', button, handler);
        \});
      \}

      disconnectedCallback() \{
        this.#dispose?.();
      \}
    \}
    ```
  ],
  [
    - effect/event の配列を手動管理する必要がない
    - SolidJS と同様のパターンで実績あり
    - 一つの `dispose()` 呼び出しで全て解決
    - ネストしたコンポーネントも自動的に追跡
    - `createRoot()` の実装が必要（約 200-300B のコード追加）
  ],
  alternatives: [
    1. *alien-signals 自動追跡 + 手動イベント管理*: バンドルサイズ最小だが、イベントリスナーの手動管理が必要
    2. *手動管理*: 完全な制御だが、忘れるとメモリリーク
    3. *WeakMap + FinalizationRegistry*: 自動だが cleanup タイミングが不確定
  ],
  references: (
    link("https://www.solidjs.com/docs/latest/api#createroot")[SolidJS - createRoot()],
  ),
)

#adr(
  header("コンポーネント境界の意味論", Status.Accepted, "2026-01-27"),
  [
    コンポーネントが cleanup スコープを持つかを決定する必要がある。

    検討すべき観点：
    - メモリ管理の単位
    - 再利用性
    - アンマウント時の挙動
    - Cleanup 契約との整合性
  ],
  [
    *cleanup スコープを持つ* を採用する。

    - 各 Web Component は `createRoot()` で独自の cleanup スコープを作成
    - `disconnectedCallback` で自動的に cleanup
    - コンポーネント内の全ての effect/event はスコープに紐付く
  ],
  [
    - メモリリーク防止が自動的
    - Web Components 標準のライフサイクルと統合
    - Cleanup 契約（Owner/Root ベース）と整合性がある
    - コンポーネント単位で完全に独立した管理が可能
  ],
  alternatives: [
    1. *cleanup スコープを持たない*: 手動管理が必要で、メモリリークのリスクが高い
  ],
  references: (),
)

#adr(
  header("Fragment/制御フローの境界表現", Status.Accepted, "2026-01-27"),
  [
    Fragment / if / each の境界をどう表現するかを決定する必要がある。

    検討すべき観点：
    - Hydration の容易性
    - 差分更新の効率
    - keyed list の要件
    - SSR マーカープロトコルとの整合性
  ],
  [
    *SSR マーカープロトコルに準拠* する。

    - `<!--dh:b:ID-->` ... `<!--/dh:b-->`: 制御フロー（if/each）の開始・終了
    - `<!--dh:i:ID-->`: 挿入点（0/1/複数ノード）
    - keyed list は `reconcile()` で管理し、key は要素の識別に使用

    *keyed list の表現*:
    - Compiler が `reconcile(parent, items, keyFn, createFn)` を生成
    - 各アイテムの key は `keyFn(item)` で取得
    - 新規/更新/削除は `reconcile` が差分計算して実行
  ],
  [
    - SSR マーカープロトコルと統一することで実装がシンプルに
    - コメント境界により、Hydration 時に制御フローの範囲を特定可能
    - `reconcile` がリスト差分を担当し、keyed/unkeyed を統一的に扱う
    - 制御フロー境界内のノードは動的に変化するため、コメントマーカーが適切
  ],
  alternatives: [
    1. *属性マーカー*: 動的に変化するノード群の境界を属性で表現するのは困難
    2. *マーカーなし*: Hydration 時に範囲を特定できなくなる
  ],
  references: (),
)

#adr(
  header("更新単位の責務分担", Status.Accepted, "2026-01-27"),
  [
    テキスト / 属性 / リスト差分の責務を runtime と transformer のどちらが持つかを決定する必要がある。

    検討すべき観点：
    - transformer の実装量
    - runtime のバンドルサイズ
    - 最適化の余地
    - 出力コードの簡潔さ
  ],
  [
    *Compiler-First 哲学* に基づき、以下の責務分担を採用する。

    *Compiler（Transformer）の責務*:
    - 静的/動的の分離と判定
    - 構造化配列（`fromTree` の引数）の生成
    - 最適化された更新コードの生成（`setText`, `setAttr` の呼び出し）
    - `reconcile` の呼び出しコード生成（keyed/unkeyed の判定を含む）

    *Runtime の責務*:
    - `fromTree()`: 構造化配列から DOM を生成
    - `setText()`, `setAttr()`, `setProp()`: 単純な更新操作
    - `reconcile()`: keyed list の差分計算と適用
    - `templateEffect()`: リアクティブな再実行
  ],
  [
    - Compiler が静的解析で最適化を行い、Runtime は単純な実行のみ
    - テキスト/属性の更新は Compiler が `templateEffect` 内に最適なコードを生成
    - リスト差分は Runtime の `reconcile` に集約し、出力コードの重複を防ぐ
    - `reconcile` を Runtime に持つことで ~400B 増加するが、出力コードが大幅に簡潔化
  ],
  alternatives: [
    1. *リスト差分も Compiler 展開*: 各リストに差分ロジックが埋め込まれ、出力コードが肥大化
    2. *全て Runtime*: Compiler の最適化の恩恵が受けられず、汎用コードが増える
  ],
  references: (),
)

#adr(
  header("Effect スケジューリング", Status.Accepted, "2026-01-26"),
  [
    effect の実行タイミングを決定する必要がある。

    検討すべき観点：
    - 更新の即時性 vs バッチング
    - 性能
    - alien-signals との整合性
  ],
  [
    *batched flush* を採用する。

    - alien-signals の `batch()` 関数を使用
    - `batch()` 内での複数の signal 更新は、終了時に一度だけ effect を実行
    - `templateEffect` は内部で `effect` をラップし、適切にバッチング
    - Transformer が自動的に適切な箇所で `batch()` を挿入（オプション）
    - ユーザーも手動で `batch()` を使用可能
  ],
  [
    - パフォーマンス効率的: 複数の signal 更新で何度も DOM 更新が走ることを防ぐ
    - alien-signals が標準サポートしているため、実装コストが低い
    - 明示的な制御が可能で、予測可能な挙動
    - SolidJS と同様のアプローチで実績あり
  ],
  alternatives: [
    1. *同期（即時）*: シンプルだが、パフォーマンスが低下する可能性
    2. *microtask（自動バッチング）*: 自動的だが、alien-signals がサポートしておらず、実装が複雑
  ],
  references: (
    link("https://github.com/stackblitz/alien-signals")[alien-signals - batch()],
  ),
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
