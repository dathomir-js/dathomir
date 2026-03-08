= transform/runtimeImports

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`transform` が収集した runtime import 名をもとに、
`ImportDeclaration` を Program に注入する責務を分離する。

== 提供する要素

- `RuntimeImportName` 型
- `addRuntimeImports(program, imports, runtimeModule)`

== 動作

- import 集合が空なら何もしない
- `runtimeModule` を source に持つ ImportDeclaration を 1 つ生成する
- 既存の ImportDeclaration 群の直後へ挿入する

== 設計決定

=== ADR: runtime import は単一宣言に集約する

*決定:* 必要なランタイム関数を 1 つの import 文にまとめる。

*理由:*
1. 出力コードが読みやすい
2. import 順序ルールを一元化しやすい

== テストケース

- imports が空の場合は Program.body を変更しない
- 既存 import がない場合は先頭に挿入する
- 既存 import がある場合はその直後に挿入する
- 指定された import 名がすべて specifier に含まれる
