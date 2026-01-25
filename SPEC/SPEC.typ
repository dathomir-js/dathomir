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
  ],
  steps: [
    1. Hydration 対象の root（Document / ShadowRoot）を特定
    2. TreeWalker でコメントマーカーを線形走査
    3. マーカーの種類（text/insert/block）に応じて effect を接続
    4. `data-dh` 属性がある要素にはイベント/属性バインディングを接続
    5. `data-dh-hydrated` フラグを設定（冪等性保証）
  ],
  postconditions: [
    - すべての動的箇所に effect/イベントが接続されている
    - Signal の更新が DOM に反映される状態になっている
    - 二重初期化が防止されている
  ],
  errors: [
    - *マーカー不一致*: SSR/CSR の出力が異なる場合の方針（未決定）
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
