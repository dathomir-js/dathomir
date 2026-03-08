= transform/state

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

transform 処理中に共有される状態と小さなユーティリティを提供する。

== 提供する要素

- `TransformState` 型
- `createInitialState(mode)`
- `createTemplateId(state)`

== 設計決定

=== ADR: 状態初期化を専用関数に分離

*決定:* `transform` 本体で直接オブジェクトを組み立てず、`createInitialState` を使う。

*理由:*
1. 状態構造の変更時に初期化箇所を 1 か所へ集約できる
2. 単体テストで初期値を検証しやすい

== テストケース

- `createInitialState("csr")` が既定フィールドを空で初期化する
- `createInitialState("ssr")` が mode を反映する
- `createTemplateId` が `_t1`, `_t2` とインクリメントする
