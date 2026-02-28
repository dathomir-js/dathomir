= entries ユーティリティ

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

`Object.entries()` の型安全なラッパーを提供する。
標準の `Object.entries()` は `[string, unknown][]` を返すが、この関数はキーと値の型情報を保持する。

== シグネチャ

```typescript
function entries<T extends Record<string, unknown>>(obj: T): Entries<T>

type Entries<T> = (keyof T extends infer U
  ? U extends keyof T
    ? [U, T[U]]
    : never
  : never)[];
```

== 動作

- `Object.entries(obj)` を呼び出し、結果を `Entries<T>` 型にキャストして返す
- ランタイムの挙動は `Object.entries()` と同一
- 型レベルでのみ強化される

== テストケース

- オブジェクトのエントリーを型安全に返す
- 空のオブジェクトに対して空配列を返す
