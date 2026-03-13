= spread API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

動的な props オブジェクトの差分を計算し、変更された属性のみを DOM に適用する。

== 機能仕様

#feature_spec(
  name: "spread",
  summary: [
    前回の props と今回の props の差分を取り、変更のみを適用する。戻り値を次回呼び出しの `prev` として使用する。
  ],
  api: [
    ```typescript
    function spread(
      element: Element,
      prev: SpreadProps | null,
      next: SpreadProps
    ): SpreadProps
    ```

    ```typescript
    type SpreadProps = Record<string, unknown>
    ```

    *動作仕様*:
    - 新しいキーは `setAttr` で設定
    - 削除されたキーは `setAttr(element, key, null)` で削除
    - イベントハンドラ（`on` で始まり 3 文字以上のキー、値が関数）は `addEventListener`/`removeEventListener` で管理
    - `WeakMap` で要素ごとのイベントハンドラを追跡
    - defensive runtime behavior として、`element` が `null` / `undefined` なら何もしない（DEV モードでは警告）

    *イベントハンドラ判定*:
    ```typescript
    key.startsWith("on") && key.length > 2 && typeof value === "function"
    ```
  ],
  test_cases: [
    - 初期 props の適用
    - 新しい属性の追加
    - 変更された props の更新
    - 存在しなくなった props の削除
    - 削除された props の removeAttribute
    - 変更のない props は更新しない
    - イベントハンドラの処理
    - イベントハンドラの正しい更新
    - 削除されたイベントハンドラの除去
    - チェーン用に next props を返す
    - 複数 props の一括処理
    - null props オブジェクトの処理
    - boolean 属性の処理
    - style 属性の処理
    - aria 属性の処理
    - element が null の場合の no-op
  ],
  impl_notes: [
    - `prev` を戻り値として返すことで、外部状態管理を不要にする
    - `WeakMap` でイベントハンドラを管理し、GC によるメモリ解放を保証
    - `setAttr` を内部で使用し、属性設定ロジックを重複させない
  ],
)
