= transform/navigation

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 機能仕様

#feature_spec(
  name: "generateNavigation",
  summary: [
    tree パス（`[0, 1, ...]`）から DOM ノードに到達するナビゲーション式を生成する。
  ],
  api: [
    ```typescript
    function generateNavigation(
      fragmentId: Identifier,
      path: number[],
      state: TransformState,
    ): ESTNode
    ```

    - 先頭ノード取得に `firstChild(fragmentId)` を使用する
    - 兄弟移動に `nextSibling(...)` を使用する
    - 子階層へ進むときに `firstChild(...)` を再適用する
    - 必要な runtime import（`firstChild`, `nextSibling`）を state に登録する
  ],
  test_cases: [
    - 空パスで `firstChild(fragmentId)` を返す
    - 兄弟インデックスで `nextSibling` 呼び出しを重ねる
    - ネストパスで `firstChild` と `nextSibling` を組み合わせる
  ],
)
