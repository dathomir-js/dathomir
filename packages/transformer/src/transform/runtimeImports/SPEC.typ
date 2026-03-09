= transform/runtimeImports

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
	header: header("runtime import は単一宣言に集約する", Status.Accepted, "2026-03-09"),
	context: [
		transform は必要なランタイム関数を収集して Program へ注入する。
	],
	decision: [
		必要なランタイム関数を 1 つの import 文にまとめる。
	],
	rationale: [
		- 出力コードが読みやすい
		- import 順序ルールを一元化しやすい
	],
)

== 機能仕様

#feature_spec(
	name: "runtime import injection",
	summary: [
		`transform` が収集した runtime import 名をもとに、`ImportDeclaration` を Program に注入する。
	],
	api: [
		- `RuntimeImportName` 型
		- `addRuntimeImports(program, imports, runtimeModule)`
	],
	constraints: [
		- import 集合が空なら何もしない
		- `runtimeModule` を source に持つ ImportDeclaration を 1 つ生成する
		- 既存の ImportDeclaration 群の直後へ挿入する
	],
	test_cases: [
		- imports が空の場合は Program.body を変更しない
		- 既存 import がない場合は先頭に挿入する
		- 既存 import がある場合はその直後に挿入する
		- 指定された import 名がすべて specifier に含まれる
	],
)
