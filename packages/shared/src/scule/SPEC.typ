= scule（文字列ケース変換）ユーティリティ

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

文字列のケース変換（camelCase, kebab-case, PascalCase 等）を型安全に提供する。
型レベルで変換結果を推論できる。

== 提供する関数

=== splitByCase

文字列を大文字/小文字の境界、セパレータで分割する。

```typescript
function splitByCase<T extends string>(
  str: T, separators?: string
): SplitByCase<T>
```

=== upperFirst / lowerFirst

先頭文字の大文字/小文字変換。

=== camelCase / pascalCase / kebabCase / snakeCase / flatCase / trainCase / titleCase

各ケース変換関数。入力文字列を適切な形式に変換する。

== 動作

- セパレータ（`-`, `_`, `/`, `.`）と大文字小文字の境界で単語を分割
- 分割した単語を各フォーマットに従って結合
- 型レベルでも変換が追跡される

== テストケース

- 各ケース変換関数が正しく動作する
- セパレータ付き文字列を正しく分割する
- 空文字列に対して空文字列を返す
