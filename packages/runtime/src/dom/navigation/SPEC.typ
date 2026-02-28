= navigation API

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`fromTree` で生成された DOM フラグメント内を走査し、動的ノードへの参照を取得する。

== 関数

=== `firstChild`

```typescript
function firstChild(node: Node, isText?: boolean): Node
```

ノードの最初の子を取得する。

- `isText` が `true` の場合、最初のテキストノードを探索する
- 子が見つからない場合は `null!` を返す（non-null assertion により runtime error）

=== `nextSibling`

```typescript
function nextSibling(node: Node): Node
```

次の兄弟ノードを取得する。見つからない場合は `null!` を返す（non-null assertion により runtime error）。

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

- Transformer が生成するナビゲーションコード（`firstChild(firstChild(root))` 等）で使用
- テキストノード探索は、テンプレート内のテキストプレースホルダーへの参照取得に必要
- non-null assertion により、DOM 構造の不整合があれば実行時エラーで検出
