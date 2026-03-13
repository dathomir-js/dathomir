= deserialize API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR でシリアライズされた状態を Hydration 時にデシリアライズする。

== 機能仕様

#feature_spec(
  name: "deserializeState",
  summary: [
    `devalue` の `parse` を使用して、シリアライズされた文字列を `StateObject` に復元する。
  ],
  api: [
    ```typescript
    function deserializeState(serialized: string): StateObject
    ```

    - `serialized`: `devalue` の `stringify` でシリアライズされた文字列
    - 戻り値: 復元された `StateObject`
  ],
  test_cases: [
    - プリミティブ値のデシリアライズ
    - null 値のデシリアライズ
    - 配列のデシリアライズ
    - Date オブジェクトのデシリアライズ
    - Map オブジェクトのデシリアライズ
    - Set オブジェクトのデシリアライズ
  ],
)

#feature_spec(
  name: "parseStateScript",
  summary: [
    `<script type="application/json" data-dh-state>` 要素からシリアライズされた状態を取得し、デシリアライズする。パース後にスクリプト要素を DOM から削除する。
  ],
  api: [
    ```typescript
    function parseStateScript(
      container: Element | ShadowRoot
    ): StateObject | null
    ```

    - `container`: スクリプト要素を検索するコンテナ
    - 戻り値: デシリアライズされた `StateObject`、スクリプトが見つからない場合は `null`
  ],
  test_cases: [
    - state script の検出とパース
    - state script の DOM からの削除
    - state script が見つからない場合に null を返す
    - ネストコンテナの処理
    - 複雑な state オブジェクトの処理
  ],
)

#feature_spec(
  name: "parseStoreScript",
  summary: [
    `<script type="application/json" data-dh-store>` 要素から store snapshot を取得し、デシリアライズする。パース後にスクリプト要素を DOM から削除する。
  ],
  api: [
    ```typescript
    function parseStoreScript(
      container: Element | ShadowRoot
    ): StateObject | null
    ```

    - `container`: スクリプト要素を検索するコンテナ
    - 戻り値: デシリアライズされた `StateObject`、スクリプトが見つからない場合は `null`
  ],
  test_cases: [
    - store script からの store snapshot 復元
    - store snapshot script の検出とパース
  ],
  impl_notes: [
    - `devalue` を使用することで、`Date`、`RegExp`、`Map`、`Set`、`bigint` 等の複雑な型も安全にデシリアライズ
    - スクリプト要素の削除により、Hydration 後の DOM をクリーンに保つ
    - `type="application/json"` により、ブラウザがスクリプトを実行しない
    - `data-dh-state` と `data-dh-store` は責務を分離し、store snapshot は `parseStoreScript()` でのみ読む
    - 依存: `devalue` の `parse` 関数、`StateObject` 型は `ssr/serialize` から参照
  ],
)
