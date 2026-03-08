= transform/mode-ssr

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR モードの JSX 変換ロジックを提供する。

== 提供する関数

```typescript
function transformJSXForSSRNode(
  node: JSXElement | JSXFragment,
  state: TransformState,
  nested: NestedTransformers,
): ESTNode
```

== 動作

- `jsxToTree` の結果を `renderToString(tree, state, new Map(...))` に変換
- dynamic parts のうち text / insert / attr / spread を Map の動的値へ反映
- event は SSR HTML 出力に不要のため除外

== テストケース

- `renderToString` import が登録される
- 動的値なしで `new Map([])` を生成する
- 動的値ありで `[1, expr]` 形式のエントリを生成する
- event dynamic part は dynamic Map に含まれない
