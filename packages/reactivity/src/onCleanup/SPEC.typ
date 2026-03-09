= onCleanup API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

現在の root が破棄されたときに呼び出されるクリーンアップ関数を登録する。

== 機能仕様

#feature_spec(
  name: "onCleanup",
  summary: [
    createRoot の owner スコープにクリーンアップ関数を登録し、dispose 時に安全に実行する。
  ],
  api: [
    ```typescript
    function onCleanup(fn: () => void): void
    ```

    *登録*:
    - createRoot スコープ内で呼び出す必要がある
    - クリーンアップ関数は現在の owner の cleanups 配列に追加される
    - `dispose()` が呼び出されたときに登録順に呼び出される

    *実行*:
    - owner の `dispose()` が実行されたときに呼び出される
    - すべての追跡された effect がクリーンアップされた後に呼び出される
    - あるクリーンアップでの例外は他のクリーンアップの実行を妨げない
  ],
  edge_cases: [
    - createRoot 外で呼び出し → 何もしない（関数は無視される）
    - 複数回の登録 → すべて順番に呼び出される
    - クリーンアップが throw → 次のクリーンアップを継続
  ],
  test_cases: [
    - createRoot 内でクリーンアップ関数を登録する
    - 複数のクリーンアップ関数を順番に呼び出す
    - createRoot 外でクリーンアップを登録しない
    - カスタムクリーンアップの前に effect をクリーンアップする
    - dispose でのすべてのクリーンアップを実行する
    - あるクリーンアップが throw しても他のクリーンアップを継続実行する（first と third が両方実行される）
    - createRoot 外で呼び出されたときは何もしない
  ],
)
