= transform/state

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
	header: header("状態初期化を専用関数に分離", Status.Accepted, "2026-03-09"),
	context: [
		`transform` 本体で状態オブジェクトを直接組み立てると、構造変更時に初期化漏れが発生しやすい。
	],
	decision: [
		`transform` 本体で直接オブジェクトを組み立てず、`createInitialState` を使う。
	],
	rationale: [
		- 状態構造の変更時に初期化箇所を 1 か所へ集約できる
		- 単体テストで初期値を検証しやすい
	],
)

== 機能仕様

#feature_spec(
	name: "transform shared state",
	summary: [
		transform 処理中に共有される状態型と、初期化・テンプレート ID 採番ユーティリティを提供する。
	],
	api: [
		- `TransformState` 型
		- `createInitialState(mode)`
		- `createTemplateId(state)`
		- `createClientActionId(state)`
	],
	test_cases: [
		- `createInitialState("csr")` が既定フィールドを空で初期化する
		- `createInitialState("ssr")` が mode を反映する
		- `createTemplateId` が `_t1`, `_t2` とインクリメントする
		- `createClientActionId` が `dh-ca-1`, `dh-ca-2` とインクリメントする
	],
)
