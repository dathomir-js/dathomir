#import "../functions.typ": feature_spec
#import "../settings.typ": apply-settings
#show: apply-settings

= runtime CSR 機能詳細設計

#feature_spec(
  name: "fromTree",
  summary: [
    構造化配列（IR）から DOM フラグメントを生成するファクトリ関数を返す。
    テンプレートをクローンして再利用することで効率的な DOM 生成を実現。
  ],
  api: [
    ```typescript
    type Tree = [string, Record<string, unknown> | null, ...TreeChild[]]
    type TreeChild = string | Tree | ['\{text\}', null] | ['\{insert\}', null]

    function fromTree(tree: Tree[], ns: number): () => DocumentFragment
    ```

    *パラメータ*:
    - `tree`: 構造化配列（ルート要素の配列）
    - `ns`: 名前空間フラグ（0: HTML, 1: SVG, 2: MathML）

    *戻り値*: DocumentFragment を返すファクトリ関数
  ],
  edge_cases: [
    1. *空配列*: `fromTree([], 0)` の動作
    2. *SVG 名前空間*: SVG 要素の正しい作成
    3. *プレースホルダー*: `\{text\}`, `\{insert\}` の処理
    4. *ネスト深度*: 深くネストした構造
    5. *特殊要素*: `<script>`, `<style>`, `<template>`
  ],
  test_cases: [
    *基本動作*:
    + 単一要素: `[['div', null]]` → `<div></div>`
    + 属性あり: `[['div', \{class: 'foo'\}]]` → `<div class="foo">`
    + テキスト: `[['div', null, 'hello']]` → `<div>hello</div>`
    + ネスト: `[['div', null, ['span', null, 'text']]]`

    *プレースホルダー*:
    + `\{text\}` → 空の Text ノードが作成される
    + `\{insert\}` → Comment ノードが作成される

    *テンプレートクローン*:
    + ファクトリを2回呼ぶと異なる DOM が返る
    + 内部でテンプレートがキャッシュされる

    *名前空間*:
    + ns=1 で SVG 要素が createElementNS で作成される
    + SVG 内の要素も SVG 名前空間を継承
  ],
  impl_notes: [
    *キャッシュ戦略*:
    - 初回呼び出しで template 要素を作成
    - 以降は cloneNode(true) でクローン

    *パフォーマンス*:
    - 目標: 1000 要素の生成 < 5ms
    - DOM API 呼び出しを最小限に

    *バンドルサイズ*:
    - fromTree + navigation + text + attr + events: ~800B 目標
  ],
)

#feature_spec(
  name: "navigation",
  summary: [
    DOM ツリーをナビゲートして特定のノードを取得する関数群。
    Transformer が生成するコードで使用される。
  ],
  api: [
    ```typescript
    function firstChild(node: Node, isText?: boolean): Node
    function nextSibling(node: Node): Node
    ```

    *パラメータ*:
    - `node`: 起点となるノード
    - `isText`: true の場合、テキストノードを期待（スキップしない）

    *戻り値*: 取得されたノード
  ],
  edge_cases: [
    1. *null ノード*: 子がない場合
    2. *テキストノードスキップ*: 空白テキストノードの処理
    3. *コメントノード*: コメントノードの処理
  ],
  test_cases: [
    *firstChild*:
    + 最初の子要素を返す
    + isText=true で最初のテキストノードを返す
    + 子がない場合は null を返す

    *nextSibling*:
    + 次の兄弟ノードを返す
    + 兄弟がない場合は null を返す

    *組み合わせ*:
    + `nextSibling(firstChild(parent))` で2番目の子を取得
  ],
  impl_notes: [
    *シンプルな実装*:
    - `firstChild`: `node.firstChild`
    - `nextSibling`: `node.nextSibling`
    - ラッパーとしてインライン化されることを期待
  ],
)

#feature_spec(
  name: "setText",
  summary: [
    テキストノードの内容を更新する。templateEffect 内で使用される。
  ],
  api: [
    ```typescript
    function setText(node: Text, value: unknown): void
    ```
  ],
  edge_cases: [
    1. *null/undefined*: 空文字列として扱う
    2. *オブジェクト*: toString() を呼ぶ
    3. *同じ値*: 変更をスキップするか
  ],
  test_cases: [
    + 文字列が正しく設定される
    + 数値が文字列に変換される
    + null は空文字列になる
    + undefined は空文字列になる
    + 同じ値を設定しても例外にならない
  ],
  impl_notes: [
    *実装*: `node.textContent = value == null ? '' : String(value)`
    *パフォーマンス*: 同じ値の場合はスキップを検討
  ],
)

#feature_spec(
  name: "setAttr / setProp",
  summary: [
    要素の属性またはプロパティを更新する。
  ],
  api: [
    ```typescript
    function setAttr(element: Element, name: string, value: unknown): void
    function setProp(element: Element, name: string, value: unknown): void
    ```
  ],
  edge_cases: [
    1. *boolean 属性*: `disabled`, `checked` など
    2. *null/undefined*: 属性を削除
    3. *class vs className*: どちらを使うか
    4. *style オブジェクト*: オブジェクト形式の style
    5. *data-\* 属性*: dataset を使うか
  ],
  test_cases: [
    *setAttr*:
    + 文字列属性が設定される
    + null で属性が削除される
    + false で属性が削除される
    + true で空文字列が設定される

    *setProp*:
    + プロパティが直接設定される
    + null でプロパティが設定される（削除ではない）

    *class*:
    + class 属性が正しく設定される
    + 配列やオブジェクト形式はサポート外（将来検討）

    *style*:
    + 文字列 style が設定される
    + オブジェクト形式は setProp で cssText を設定
  ],
  impl_notes: [
    *属性 vs プロパティ*:
    - デフォルトは setAttribute
    - value, checked など一部はプロパティアクセスが必要

    *バンドルサイズ*:
    - setAttr + setProp: ~100B 目標
  ],
)

#feature_spec(
  name: "spread",
  summary: [
    動的な属性オブジェクトを要素に適用する。
    前回の値と比較して差分のみを更新。
  ],
  api: [
    ```typescript
    function spread(
      element: Element,
      props: Record<string, unknown>,
      prevProps?: Record<string, unknown>
    ): Record<string, unknown>
    ```

    *戻り値*: 次回比較用の props（prevProps として渡す）
  ],
  edge_cases: [
    1. *イベントハンドラ*: on\* プロパティの処理
    2. *削除された属性*: prevProps にあって props にない
    3. *空オブジェクト*: 全属性を削除
  ],
  test_cases: [
    + 新しい属性が追加される
    + 変更された属性が更新される
    + 削除された属性が removeAttribute される
    + イベントハンドラが正しく処理される
    + 同じ値の属性は更新されない
  ],
  impl_notes: [
    *差分検出*:
    - Object.keys で両方のキーを列挙
    - 値の比較で変更を検出

    *イベント判定*:
    - `key.startsWith('on') && key.length > 2 && typeof value === 'function'`

    *バンドルサイズ*:
    - ~150B 目標
  ],
)

#feature_spec(
  name: "event",
  summary: [
    要素にイベントリスナーを登録する。
    createRoot の dispose 時に自動解除される。
  ],
  api: [
    ```typescript
    function event(
      type: string,
      element: Element,
      handler: EventListener
    ): void
    ```
  ],
  edge_cases: [
    1. *重複登録*: 同じイベントに複数回登録
    2. *ハンドラ変更*: 動的に変わるハンドラ
    3. *passive オプション*: スクロールイベントなど
  ],
  test_cases: [
    + イベントが発火するとハンドラが呼ばれる
    + createRoot.dispose() でリスナーが解除される
    + 解除後はイベントが発火してもハンドラが呼ばれない
  ],
  impl_notes: [
    *実装*:
    - `element.addEventListener(type, handler)`
    - `onCleanup(() => element.removeEventListener(type, handler))`

    *直付け方式*:
    - イベント委譲は採用しない（v2 で検討）
  ],
)
