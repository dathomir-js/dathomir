= transform/jsx

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

JSX ノード形状（oxc-parser 出力）に関する型と、
transform の中核で使う JSX ヘルパーを提供する。

== 提供する要素

- JSX 型定義（`JSXElement`, `JSXFragment`, `JSXChild` など）
- タグ判定（`isComponentTag`）
- 名前変換（`jsxNameToExpression`, `getTagName`）
- 識別子妥当性判定（`isValidIdentifier`）

== 設計決定

=== ADR: コンポーネント判定は JSX 慣例に従う

*決定:* タグ名先頭が大文字、または `JSXMemberExpression` はコンポーネントとして判定する。

*理由:*
1. React / SolidJS などの慣例と一致し、直感的
2. コンパイル時にランタイム情報なしで判定可能

=== ADR: JSXNamespacedName の式化はローカル規則で行う

*決定:* `ns:name` は `ns_name` 識別子に変換する。

*理由:*
1. ESTree の Identifier として扱いやすい
2. 既存 transform 実装との互換を保つ

== テストケース

- `isComponentTag` が大文字タグ・メンバー式タグを true と判定する
- 小文字タグを false と判定する
- `jsxNameToExpression` が Identifier / MemberExpression を生成する
- `getTagName` がネストしたメンバー名を文字列化する
- `isValidIdentifier` が `data-foo` を false と判定する
