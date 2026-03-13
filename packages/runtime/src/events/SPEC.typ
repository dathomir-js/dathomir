= events API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

DOM イベントリスナーを登録し、`createRoot` スコープの破棄時に自動でクリーンアップする。

== 機能仕様

#feature_spec(
  name: "event",
  summary: [
    要素にイベントリスナーを登録する。`addEventListener` でリスナーを追加し、`onCleanup` を使用して `createRoot` スコープ破棄時に `removeEventListener` を自動実行する。Transformer が生成するコードから呼び出される。
  ],
  api: [
    ```typescript
    function event(
      type: string,
      element: Element,
      handler: EventListener
    ): void
    ```

    - `type`: イベントタイプ（`"click"`, `"keydown"`, `"custom-event"` 等）
    - `element`: イベントを登録する対象の DOM 要素
    - `handler`: イベント発火時に呼び出されるリスナー関数
  ],
  test_cases: [
    - ハンドラがイベント発火時に呼ばれる
    - 複数イベントでハンドラが複数回呼ばれる
    - dispose でイベントリスナーを削除
    - dispose 後はハンドラが呼ばれない
    - イベントオブジェクトをハンドラに渡す
    - 異なるイベントタイプの処理
    - カスタムイベントのサポート
    - カスタムイベントの detail を受信
    - 同じ要素への複数イベント
    - root 内の全イベントを dispose
    - キーボードイベントの処理
    - キーボードイベントのキーを受信
    - createRoot スコープ外でもリスナーを登録
  ],
  impl_notes: [
    - `onCleanup` による自動クリーンアップで、メモリリークを防止
    - イベント委譲（delegation）は使用しない（Web Components の Shadow DOM 境界と相性が悪い）
    - `createRoot` スコープ外で呼ばれた場合でもリスナーは登録されるが、自動クリーンアップは行われない
  ],
)
