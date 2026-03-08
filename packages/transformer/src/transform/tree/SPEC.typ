= transform/tree

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

JSX を構造化配列 tree に変換し、
動的パーツ（text / attr / event / spread / insert）を収集する。

== 提供する要素

- `DynamicPart`, `TreeResult` 型
- `containsReactiveAccess`
- `processAttributes`
- `processChildren`
- `jsxElementToTree`
- `jsxToTree`

== 設計決定

=== ADR: Fragment の dynamicParts は参照渡し配列を返す

*決定:* Fragment 変換では `children.flatMap` ではなく、
`processChildren` へ渡した `dynamicParts` ローカル変数をそのまま返す。

*理由:*
1. `processChildren` は `dynamicParts` に直接 push する設計
2. flatMap では動的パーツを取りこぼす可能性がある

=== ADR: コンポーネント子要素は insert プレースホルダに変換

*決定:* 子要素がコンポーネントの場合、tree には `"{insert}"` を置き、
`DynamicPart` に `isComponent: true` の insert を記録する。

== テストケース

- 静的 HTML を tree 化できる
- `signal.value` を含む属性が attr dynamic part になる
- イベント属性が event dynamic part になる
- `.map()` / ternary / call expression が insert dynamic part になる
- Fragment 内の動的テキスト・コンポーネント insert を取りこぼさない
