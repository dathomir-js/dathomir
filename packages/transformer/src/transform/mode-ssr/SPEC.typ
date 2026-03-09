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
- logical expression や JSX を含む一般式は `insert` dynamic part として Map の動的値へ反映
- event は SSR HTML 出力に不要のため除外
- text / insert は SSR マーカー ID と一致する連番キー（1..n）を優先して割り当てる
- attr / spread は連番キーを壊さないように text / insert の後ろのキーへ配置する

== テストケース

- `renderToString` import が登録される
- 動的値なしで `new Map([])` を生成する
- 動的値ありで `[1, expr]` 形式のエントリを生成する
- event dynamic part は dynamic Map に含まれない
- attr dynamic part が先に出現しても text / insert のキー対応が崩れない

=== ADR: SSR dynamic Map のキー安定化

*決定:* `renderToString` へ渡す `dynamicValues` は、
まず text/insert dynamic part に対して 1..n の連番キーを割り当て、
その後 attr/spread dynamic part を n+1 以降へ配置する。

*理由:*
1. SSR ランタイムのマーカー参照は text/insert プレースホルダーに対する連番 ID で行われる
2. attr/spread を同じ連番に混在させると、後続 insert/text が別 ID を参照して値がずれる
