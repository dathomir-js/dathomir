= navigation API

#import "../../../../../SPEC/settings.typ": *
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
- 子が見つからない場合はエラーを投げる

=== `nextSibling`

```typescript
function nextSibling(node: Node): Node
```

次の兄弟ノードを取得する。見つからない場合はエラーを投げる。

== 設計判断

- Transformer が生成するナビゲーションコード（`firstChild(firstChild(root))` 等）で使用
- テキストノード探索は、テンプレート内のテキストプレースホルダーへの参照取得に必要
- エラーを投げることで、DOM 構造の不整合を早期に検出
