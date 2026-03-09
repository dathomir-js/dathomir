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
- `logical expression`（`&&` / `||`）が insert dynamic part になる
- JSX を含む一般式（Array/Object/Binary など）が insert dynamic part になる
- `JSXSpreadChild` が insert dynamic part になる
- namespaced 属性（`xlink:href`）が文字列キーとして保持される
- Fragment 内の動的テキスト・コンポーネント insert を取りこぼさない

=== ADR: 式コンテナの mode-aware JSX フォールバック

*決定:* `.map()` / ternary / call に加えて、式サブツリー内に JSX ノードを含む場合は
`insert` dynamic part として扱い `transformNestedJSX` を適用する。

*理由:*
1. 条件分岐や配列・オブジェクト式に JSX が埋め込まれるケースを取りこぼさないため
2. text dynamic part へ誤分類すると JSX ノードの評価が破綻するため

=== ADR: namespaced 属性キーの正規化

*決定:* `JSXNamespacedName` 属性は `namespace:name` 文字列キーとして扱う。

*理由:*
1. JavaScript 識別子に変換できない属性名を安全に保持するため
2. SVG 属性（`xlink:href` など）を落とさず変換するため
