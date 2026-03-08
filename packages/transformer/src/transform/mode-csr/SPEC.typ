= transform/mode-csr

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

CSR モードの JSX 変換ロジックを提供する。

== 提供する関数

```typescript
function transformJSXNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode
```

== 動作

- `fromTree(tree, 0)` でテンプレートを作成
- dynamic parts に応じて `setText`, `setAttr`, `event`, `spread`, `insert` を生成
- コンポーネント insert は `templateEffect` でラップしない
- 条件式 / map などの動的 insert は `templateEffect` でラップする

== テストケース

- 静的要素が IIFE + fragment return に変換される
- text / attr が `templateEffect` を使用する
- event が `event(type, node, handler)` で生成される
- component insert は `templateEffect` なし
- dynamic insert は `templateEffect` あり
