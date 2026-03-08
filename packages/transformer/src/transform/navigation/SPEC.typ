= transform/navigation

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

tree パス（`[0, 1, ...]`）から DOM ノードへ到達するための
ナビゲーション式を生成する。

== 提供する関数

```typescript
function generateNavigation(
  fragmentId: Identifier,
  path: number[],
  state: TransformState,
): ESTNode
```

== 動作

- 先頭ノード取得に `firstChild(fragmentId)` を使用
- 兄弟移動に `nextSibling(...)` を使用
- 子階層へ進むときに `firstChild(...)` を再適用
- 必要な runtime import（`firstChild`, `nextSibling`）を state に登録

== テストケース

- 空パスで `firstChild(fragmentId)` を返す
- 兄弟インデックスで `nextSibling` 呼び出しを重ねる
- ネストパスで `firstChild` と `nextSibling` を組み合わせる
