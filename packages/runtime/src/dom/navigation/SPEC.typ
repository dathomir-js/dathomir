= navigation API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`fromTree` で生成された DOM フラグメント内を走査し、動的ノードへの参照を取得する。

== 機能仕様

#feature_spec(
  name: "firstChild / nextSibling",
  summary: [
    DOM ツリーのナビゲーション関数。Transformer が生成するナビゲーションコード（`firstChild(firstChild(root))` 等）で使用される。
  ],
  api: [
    ```typescript
    function firstChild(node: Node, isText?: boolean): Node
    ```

    ノードの最初の子を取得する。

    - `isText` が `true` の場合、最初のテキストノードを探索する
    - 子が見つからない場合は `null!` を返す（non-null assertion により runtime error）

    ```typescript
    function nextSibling(node: Node): Node
    ```

    次の兄弟ノードを取得する。見つからない場合は `null!` を返す（non-null assertion により runtime error）。
  ],
  test_cases: [
    *firstChild*:
    - 最初の子要素を返す
    - isText\=true でテキストノードを返す
    - isText\=true で要素をスキップしテキストノードを返す
    - 最初の子がテキストノードの場合
    - 空テキストノードの処理
    - コメントノードの処理

    *nextSibling*:
    - 次の兄弟ノードを返す
    - テキストノードの兄弟を返す
    - コメントノードの兄弟を返す
    - 複数の兄弟を連鎖的に走査

    *組み合わせ*:
    - nextSibling(firstChild(parent)) で2番目の子を取得
    - 混在ノード型を走査
    - firstChild チェーンでネスト要素を発見
  ],
  impl_notes: [
    - Transformer が生成するナビゲーションコード（`firstChild(firstChild(root))` 等）で使用
    - テキストノード探索は、テンプレート内のテキストプレースホルダーへの参照取得に必要
    - non-null assertion により、DOM 構造の不整合があれば実行時エラーで検出
  ],
)

== 設計判断

#adr(
  header("non-null assertion によるエラーハンドリング", Status.Accepted, "2026-02-11"),
  [
    Generated code では必ず次のノードが存在する前提。明示的なエラー処理はバンドルサイズを増やす。
  ],
  [
    `!` (non-null assertion) を使用してコンパクトな実装を維持。
    - `return child!` や `return node.nextSibling!` のように記述
    - 万が一 null だった場合、ブラウザが `TypeError: Cannot read properties of null` を投げる
    - Transformer が正しいコードを生成する責任を持つ
    - バンドルサイズは最小限（明示的な if 文やエラーメッセージ不要）
  ],
  [
    バンドルサイズを最小化しつつ、DOM 構造の不整合は実行時エラーで検出できる。
  ],
)
