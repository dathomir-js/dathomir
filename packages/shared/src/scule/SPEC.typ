= scule（文字列ケース変換）ユーティリティ

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

文字列のケース変換（camelCase, kebab-case, PascalCase 等）を型安全に提供する。
型レベルで変換結果を推論できる。

== インターフェース仕様

#interface_spec(
  name: "string case utilities",
  summary: [
    文字列を単語境界で分割し、複数のケース形式へ変換するユーティリティ群。
  ],
  format: [
    *主要関数*:
    - `isUppercase(char?: string): boolean | undefined`
    - `splitByCase<T extends string>(str: T, separators?: string): SplitByCase<T>`
    - `upperFirst(value?: string): string`
    - `lowerFirst(value?: string): string`
    - `camelCase(value?: string): string`
    - `pascalCase(value?: string): string`
    - `kebabCase(value?: string): string`
    - `snakeCase(value?: string): string`
    - `flatCase(value?: string): string`
    - `trainCase(value?: string): string`
    - `titleCase(value?: string): string`
  ],
  constraints: [
    - セパレータ（`-`, `_`, `/`, `.`）と大文字小文字の境界で単語を分割する
    - 分割した単語を各フォーマットに従って結合する
    - 型レベルでも変換結果を追跡する
    - `titleCase` は冠詞・前置詞等（a, an, and, as, at, but, by, for, if, in, is, nor, of, on, or, the, to, with）を小文字のまま保持する
  ],
)

== 機能仕様

#feature_spec(
  name: "case conversion coverage",
  summary: [
    単語分割、先頭文字変換、代表的なケース変換関数の正しさを検証する。
  ],
  edge_cases: [
    - `isUppercase` は数値文字で `undefined` を返す
    - 空文字列は空配列または空文字列として扱う
    - 連続大文字（頭字語）を正しく分割する
  ],
  test_cases: [
    *isUppercase*:
    - 大文字文字に対して `true` を返す
    - 小文字文字に対して `false` を返す
    - 空文字列に対して `false` を返す
    - 数値文字に対して `undefined` を返す

    *splitByCase*:
    - セパレータ付き文字列を正しく分割する
    - 空文字列に対して空配列を返す
    - 単一単語を正しく処理する
    - 連続大文字（頭字語）を正しく分割する

    *upperFirst / lowerFirst*:
    - 先頭文字を大文字/小文字に変換する
    - 空文字列に対して空文字列を返す
    - 既に変換済みの場合はそのまま返す

    *camelCase / pascalCase / kebabCase / snakeCase / flatCase / trainCase / titleCase*:
    - 各ケースに変換する
    - 空呼び出しで空文字列を返す
    - `titleCase` は例外語を小文字で保持する
  ],
)
