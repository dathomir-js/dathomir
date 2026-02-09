= fromEntries ユーティリティ

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

`Object.fromEntries()` の型安全なラッパーを提供する。
エントリー配列からオブジェクトを生成し、キーと値の型情報を保持する。

== シグネチャ

```typescript
function fromEntries<T extends [PropertyKey, unknown][]>(
  entries: T
): FromEntries<T>

type FromEntries<T extends [PropertyKey, unknown][]> = {
  [K in T[number][0]]: Extract<T[number], [K, unknown]>[1];
};
```

== 動作

- エントリー配列を `reduce` で処理し、オブジェクトを構築する
- キーと値の型をエントリー配列から推論する
- ランタイムの挙動は `Object.fromEntries()` と同等

== テストケース

- エントリー配列からオブジェクトを型安全に生成する
- 空配列に対して空オブジェクトを返す
