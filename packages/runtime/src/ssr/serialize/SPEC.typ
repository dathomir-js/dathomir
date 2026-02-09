= serialize API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

Signal の初期値を SSR 時にシリアライズし、Hydration で復元可能にする。

== 関数

=== `serializeState`

```typescript
function serializeState(state: StateObject): string
```

`devalue` の `stringify` を使用して、状態オブジェクトを XSS 安全な文字列にシリアライズする。

=== `isSerializable`

```typescript
function isSerializable(value: unknown): value is SerializableValue
```

値がシリアライズ可能かを判定する。関数と `Symbol` は不可。

== 型定義

```typescript
type SerializableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | RegExp
  | Map<SerializableValue, SerializableValue>
  | Set<SerializableValue>
  | bigint
  | SerializableValue[]
  | { [key: string]: SerializableValue };

type StateObject = Record<string, SerializableValue>;
```

== 依存関係

- `devalue` の `stringify` 関数

== 設計判断

- `devalue` を使用することで、`JSON.stringify` では扱えない型（`Date`、`Map`、`Set`、`bigint` 等）をサポート
- `devalue` は XSS 安全な出力を保証（`</script>` や `<!--` を含まない）
- `isSerializable` は開発時のバリデーションに使用
