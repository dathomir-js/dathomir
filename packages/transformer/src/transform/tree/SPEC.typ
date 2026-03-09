= transform/tree

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
	header: header("Fragment の dynamicParts は参照渡し配列を返す", Status.Accepted, "2026-03-09"),
	context: [
		Fragment 変換では `processChildren` が `dynamicParts` 配列へ直接 push する。
	],
	decision: [
		Fragment 変換では `children.flatMap` ではなく、`processChildren` へ渡した `dynamicParts` ローカル変数をそのまま返す。
	],
	rationale: [
		- `processChildren` は `dynamicParts` に直接 push する設計である
		- flatMap では動的パーツを取りこぼす可能性がある
	],
)

#adr(
	header: header("コンポーネント子要素は insert プレースホルダに変換", Status.Accepted, "2026-03-09"),
	context: [
		コンポーネント子要素は tree に直接埋め込まず、後段の挿入処理へ渡す必要がある。
	],
	decision: [
		子要素がコンポーネントの場合、tree には `"{insert}"` を置き、`DynamicPart` に `isComponent: true` の insert を記録する。
	],
)

#adr(
	header: header("式コンテナの mode-aware JSX フォールバック", Status.Accepted, "2026-03-09"),
	context: [
		`.map()` / ternary / call 以外にも、式サブツリー内に JSX が埋め込まれるケースがある。
	],
	decision: [
		式サブツリー内に JSX ノードを含む場合は `insert` dynamic part として扱い `transformNestedJSX` を適用する。
	],
	rationale: [
		- 条件分岐や配列・オブジェクト式に JSX が埋め込まれるケースを取りこぼさないため
		- text dynamic part へ誤分類すると JSX ノードの評価が破綻するため
	],
)

#adr(
	header: header("namespaced 属性キーの正規化", Status.Accepted, "2026-03-09"),
	context: [
		`JSXNamespacedName` は JavaScript 識別子へそのまま変換できない。
	],
	decision: [
		`JSXNamespacedName` 属性は `namespace:name` 文字列キーとして扱う。
	],
	rationale: [
		- JavaScript 識別子に変換できない属性名を安全に保持するため
		- SVG 属性（`xlink:href` など）を落とさず変換するため
	],
)

== 機能仕様

#feature_spec(
	name: "JSX to tree conversion",
	summary: [
		JSX を構造化配列 tree に変換し、動的パーツ（text / attr / event / spread / insert）を収集する。
	],
	api: [
		- `DynamicPart`, `TreeResult` 型
		- `containsReactiveAccess`
		- `processAttributes`
		- `processChildren`
		- `jsxElementToTree`
		- `jsxToTree`
	],
	test_cases: [
		- 静的 HTML を tree 化できる
		- `signal.value` を含む属性が attr dynamic part になる
		- イベント属性が event dynamic part になる
		- `.map()` / ternary / call expression が insert dynamic part になる
		- `logical expression`（`&&` / `||`）が insert dynamic part になる
		- JSX を含む一般式（Array/Object/Binary など）が insert dynamic part になる
		- `JSXSpreadChild` が insert dynamic part になる
		- namespaced 属性（`xlink:href`）が文字列キーとして保持される
		- Fragment 内の動的テキスト・コンポーネント insert を取りこぼさない
	],
)
