= transform/ast

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
	header: header("プレーン ESTree オブジェクトを直接生成する", Status.Accepted, "2026-03-09"),
	context: [
		transformer は oxc-parser + zimmerframe + esrap を基盤としている。
	],
	decision: [
		外部 AST ビルダーに依存せず、プレーンな ESTree 互換オブジェクトを返す。
	],
	rationale: [
		- 既存の transformer 設計と整合する
		- 依存を増やさず、バンドルサイズを抑えられる
		- 生成ノードの形を実装側で明示的に管理できる
	],
)

== 機能仕様

#feature_spec(
	name: "ESTree builders and guards",
	summary: [
		`transform` 実装で使用する最小限の ESTree 型定義・ノードビルダー・型ガードを提供する。JSX の意味変換は扱わない。
	],
	api: [
		- ESTree ノード型（`ESTNode`, `Program`, `Identifier`, `Literal` など）
		- ノードビルダー（`nLit`, `nId`, `nCall`, `nArr`, `nObj`, `nProp`, ...）
		- 型ガード（`isMemberExpression`, `isIdentifier`, `isCallExpression`, `isVariableDeclaration`, `isStringLiteral`）
	],
	test_cases: [
		- `nLit` が文字列 / 数値 / null を正しい `raw` 付きで生成する
		- `nCall` が `optional: false` を持つ CallExpression を生成する
		- `nProp` が init Property 形状を生成する
		- `isStringLiteral` が文字列 Literal のみ true を返す
		- 主要型ガードが該当ノードを正しく判定する
	],
)
