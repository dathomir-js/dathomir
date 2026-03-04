= scule（文字列ケース変換）ユーティリティ

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

文字列のケース変換（camelCase, kebab-case, PascalCase 等）を型安全に提供する。
型レベルで変換結果を推論できる。

== 提供する関数

=== isUppercase

文字が大文字かどうかを判定するヘルパー関数。

```typescript
function isUppercase(char?: string): boolean | undefined
```

- 数値文字の場合は `undefined` を返す
- 大文字の場合は `true` を返す
- 小文字または空文字列の場合は `false` を返す

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

- `titleCase` はセパレータ（`-`, `_`, `/`, `.`）で分割された後、冠詞・前置詞等（a, an, and, as, at, but, by, for, if, in, is, nor, of, on, or, the, to, with）を小文字のまま保持する

== 動作

- セパレータ（`-`, `_`, `/`, `.`）と大文字小文字の境界で単語を分割
- 分割した単語を各フォーマットに従って結合
- 型レベルでも変換が追跡される

== テストケース

=== isUppercase
- 大文字文字に対して `true` を返す
- 小文字文字に対して `false` を返す
- 空文字列に対して `false` を返す（デフォルト引数 `""` が使用される）
- 数値文字に対して `undefined` を返す

=== splitByCase
- 各ケース変換関数が正しく動作する
- セパレータ付き文字列を正しく分割する
- 空文字列に対して空配列を返す
- 単一単語を正しく処理する
- 連続大文字（頭字語）を正しく分割する

=== upperFirst / lowerFirst
- 先頭文字を大文字/小文字に変換する
- 空文字列に対して空文字列を返す
- 既に変換済みの場合はそのまま返す

=== camelCase / pascalCase / kebabCase / snakeCase / flatCase / trainCase / titleCase
- 各ケースに変換する
- 空呼び出しで空文字列を返す
- `titleCase` は例外語を小文字で保持する
