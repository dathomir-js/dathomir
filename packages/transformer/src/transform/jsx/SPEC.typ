= transform/jsx

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
	header: header("コンポーネント判定は JSX 慣例に従う", Status.Accepted, "2026-03-09"),
	context: [
		transform はタグ名だけで DOM 要素とコンポーネントを判定する必要がある。
	],
	decision: [
		タグ名先頭が大文字、または `JSXMemberExpression` はコンポーネントとして判定する。
	],
	rationale: [
		- React / SolidJS などの慣例と一致し、直感的である
		- コンパイル時にランタイム情報なしで判定可能である
	],
)

#adr(
	header: header("JSXNamespacedName の式化はローカル規則で行う", Status.Accepted, "2026-03-09"),
	context: [
		namespaced name はそのままでは JavaScript 識別子にできない。
	],
	decision: [
		`ns:name` は `ns_name` 識別子に変換する。
	],
	rationale: [
		- ESTree の Identifier として扱いやすい
		- 既存 transform 実装との互換を保つ
	],
)

== 機能仕様

#feature_spec(
	name: "JSX helper surface",
	summary: [
		JSX ノード形状（oxc-parser 出力）に関する型と、transform の中核で使うタグ判定・名前変換・識別子妥当性判定を提供する。
	],
	api: [
		- JSX 型定義（`JSXElement`, `JSXFragment`, `JSXChild` など）
		- タグ判定（`isComponentTag`）
		- 名前変換（`jsxNameToExpression`, `getTagName`）
		- 識別子妥当性判定（`isValidIdentifier`）
	],
	test_cases: [
		- `isComponentTag` が大文字タグ・メンバー式タグを true と判定する
		- 小文字タグを false と判定する
		- `jsxNameToExpression` が Identifier / MemberExpression を生成する
		- `getTagName` がネストしたメンバー名を文字列化する
		- `isValidIdentifier` が `data-foo` を false と判定する
	],
)
