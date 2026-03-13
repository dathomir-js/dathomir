= serialize API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

Signal の初期値を SSR 時にシリアライズし、Hydration で復元可能にする。

== 機能仕様

#feature_spec(
  name: "serializeState",
  summary: [
    `devalue` の `stringify` を使用して、状態オブジェクトを XSS 安全な文字列にシリアライズする。
  ],
  api: [
    ```typescript
    function serializeState(state: StateObject): string
    ```

    - `state`: シリアライズ対象の状態オブジェクト

    *型定義*:
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
      | SerializableValue\[\]
      | { \[key: string\]: SerializableValue };

    type StateObject = Record<string, SerializableValue>;
    ```
  ],
  test_cases: [
    *serializeState*:
    - プリミティブ値をシリアライズ
    - 配列をシリアライズ
    - ネストされたオブジェクトをシリアライズ
    - Date オブジェクトをシリアライズ
    - Map オブジェクトをシリアライズ
    - Set オブジェクトをシリアライズ
    - BigInt をシリアライズ
  ],
  impl_notes: [
    - `devalue` を使用することで、`JSON.stringify` では扱えない型（`Date`、`Map`、`Set`、`bigint` 等）をサポート
    - `devalue` は XSS 安全な出力を保証（`</script>` や `<!--` を含まない）
  ],
)

#feature_spec(
  name: "isSerializable",
  summary: [
    値がシリアライズ可能かを判定する。関数と `Symbol` は不可。
  ],
  api: [
    ```typescript
    function isSerializable(value: unknown): value is SerializableValue
    ```

    - `value`: 判定対象の値
    - 戻り値: `true` — シリアライズ可能、`false` — 不可
  ],
  test_cases: [
    *isSerializable*:
    - プリミティブに対して true を返す
    - BigInt に対して true を返す
    - 関数に対して false を返す
    - Symbol に対して false を返す
    - Date に対して true を返す
    - RegExp に対して true を返す
    - Map に対して true を返す
    - Set に対して true を返す
    - シリアライズ可能な配列に対して true を返す
    - 関数を含む配列に対して false を返す
    - シリアライズ可能なオブジェクトに対して true を返す
    - 関数を含むオブジェクトに対して false を返す
  ],
  impl_notes: [
    - `isSerializable` は開発時のバリデーションに使用
  ],
)

#feature_spec(
  name: "Atom store snapshot integration",
  summary: [
    `defineAtomStoreSnapshot` で定義した schema に基づいてシリアライズ・デシリアライズのラウンドトリップを保証する。
  ],
  test_cases: [
    - snapshot オブジェクトを serializeState と deserializeState でラウンドトリップ
    - runtime serialization を plain object layer として snapshot schema 上で維持
  ],
)

== 依存関係

- `devalue` の `stringify` 関数
