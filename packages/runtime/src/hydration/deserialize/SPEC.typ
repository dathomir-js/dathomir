= deserialize API

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR でシリアライズされた状態を Hydration 時にデシリアライズする。

== 関数

=== `deserializeState`

```typescript
function deserializeState(serialized: string): StateObject
```

`devalue` の `parse` を使用して、シリアライズされた文字列を `StateObject` に復元する。

=== `parseStateScript`

```typescript
function parseStateScript(container: Element | ShadowRoot): StateObject | null
```

`<script type="application/json" data-dh-state>` 要素からシリアライズされた状態を取得し、デシリアライズする。パース後にスクリプト要素を DOM から削除する。

== 依存関係

- `devalue` の `parse` 関数
- `StateObject` 型は `ssr/serialize` から参照

== 設計判断

- `devalue` を使用することで、`Date`、`RegExp`、`Map`、`Set`、`bigint` 等の複雑な型も安全にデシリアライズ
- スクリプト要素の削除により、Hydration 後の DOM をクリーンに保つ
- `type="application/json"` により、ブラウザがスクリプトを実行しない
