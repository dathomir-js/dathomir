= entries ユーティリティ

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`Object.entries()` の型安全なラッパーを提供する。
標準の `Object.entries()` は `[string, unknown][]` を返すが、この関数はキーと値の型情報を保持する。

== 機能仕様

#feature_spec(
  name: "entries",
  summary: [
    `Object.entries()` のランタイム挙動を保ったまま、キーと値の組み合わせを型安全に返す。
  ],
  api: [
    ```typescript
    function entries<T extends Record<string, unknown>>(obj: T): Entries<T>

    type Entries<T> = (keyof T extends infer U
      ? U extends keyof T
        ? [U, T[U]]
        : never
      : never)[];
    ```

    - `Object.entries(obj)` を呼び出し、結果を `Entries<T>` 型にキャストして返す
    - ランタイムの挙動は `Object.entries()` と同一
    - 型レベルでのみ強化される
  ],
  test_cases: [
    - オブジェクトのエントリーを型安全に返す
    - 空のオブジェクトに対して空配列を返す
    - 単一プロパティのオブジェクトを正しく処理する
    - ネストされたオブジェクトを値として正しく返す
    - null および undefined の値を正しく返す
  ],
)
