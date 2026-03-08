= transform/ast

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`transform` 実装で使用する最小限の ESTree 型定義・ノードビルダー・型ガードを提供する。

このモジュールは構文木の「生成」と「判定」に責務を限定し、
JSX の意味変換（tree 化 / CSR / SSR）は扱わない。

== 提供する要素

- ESTree ノード型（`ESTNode`, `Program`, `Identifier`, `Literal` など）
- ノードビルダー（`nLit`, `nId`, `nCall`, `nArr`, `nObj`, `nProp`, ...）
- 型ガード（`isMemberExpression`, `isIdentifier`, `isCallExpression`, `isVariableDeclaration`, `isStringLiteral`）

== 設計決定

=== ADR: プレーン ESTree オブジェクトを直接生成する

*決定:* 外部 AST ビルダーに依存せず、プレーンな ESTree 互換オブジェクトを返す。

*理由:*
1. 既存の transformer 設計（oxc-parser + zimmerframe + esrap）と整合する
2. 依存を増やさず、バンドルサイズを抑えられる
3. 生成ノードの形を実装側で明示的に管理できる

== テストケース

- `nLit` が文字列/数値/null を正しい `raw` 付きで生成する
- `nCall` が `optional: false` を持つ CallExpression を生成する
- `nProp` が init Property 形状を生成する
- `isStringLiteral` が文字列 Literal のみ true を返す
- 主要型ガードが該当ノードを正しく判定する
