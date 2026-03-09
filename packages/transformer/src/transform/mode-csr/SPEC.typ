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
- dynamic part ノード参照は副作用実行前に先に解決し、後続の DOM 変化でパスがずれないようにする
- コンポーネント insert は `templateEffect` でラップしない
- 条件式 / map などの動的 insert は `templateEffect` でラップする
- logical expression（`&&` / `||`）や JSX を含む一般式も動的 insert として `templateEffect` でラップする
- `JSXSpreadChild` 由来の挿入も動的 insert として扱う

== テストケース

- 静的要素が IIFE + fragment return に変換される
- text / attr が `templateEffect` を使用する
- event が `event(type, node, handler)` で生成される
- component insert は `templateEffect` なし
- dynamic insert は `templateEffect` あり
- 複数 insert dynamic part があっても参照ノード解決がずれない

=== ADR: dynamic part ノード参照の先行解決

*決定:* `generateNavigation` による `nodeId` の解決は dynamic part の実処理（`templateEffect`/`insert`/`event`）より先に行う。

*理由:*
1. `templateEffect` は登録時に即時実行されるため、先に insert が走ると DOM 構造が変化する
2. 変化後に次のパスを辿ると隣接 placeholder を取り違える可能性がある
