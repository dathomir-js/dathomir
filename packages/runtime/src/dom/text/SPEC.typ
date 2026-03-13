= text API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

テキストノードの内容を効率的に更新する。

== 機能仕様

#feature_spec(
  name: "setText",
  summary: [
    テキストノードの `data` プロパティを更新する。`templateEffect` 内で呼び出され、Signal 変更時に自動再実行される。
  ],
  api: [
    ```typescript
    function setText(node: Text, value: unknown): void
    ```

    - `null` または `undefined` の場合は空文字列に変換
    - それ以外は `String(value)` で文字列に変換
  ],
  test_cases: [
    - 文字列の正しい設定
    - 数値を文字列に変換
    - ゼロを文字列に変換
    - 負の数を文字列に変換
    - 浮動小数点を文字列に変換
    - null を空文字列に設定
    - undefined を空文字列に設定
    - 同じ値の設定で例外を投げない
    - 既存テキストの更新
    - 空文字列の処理
    - boolean true を文字列に変換
    - boolean false を文字列に変換
    - オブジェクトを toString で文字列に変換
    - 特殊文字の処理
    - Unicode 文字の処理
  ],
  impl_notes: [
    - `textContent` ではなく `data` プロパティを使用（テキストノード専用で効率的）
    - `null`/`undefined` を空文字列にすることで、DOM に "null" や "undefined" が表示されるのを防ぐ
  ],
)
