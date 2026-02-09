= templateEffect API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

追跡された依存関係が変更されたときに再実行されるテンプレート effect を登録する。
`effect` とは異なり、テンプレート更新用に設計されており、現在の owner スコープ
（createRoot）によって自動的に追跡される。

== シグネチャ

```typescript
function templateEffect(fn: () => void): void
```

== 動作

=== 実行

- effect 関数は作成時に即座に呼び出される
- 追跡された依存関係が変更されるたびに再実行される
- 依存関係の変更時に同期的に実行される（batch されていない場合）

=== Owner の追跡

- 現在の owner（createRoot スコープ）に自動的に登録される
- owner の dispose() が呼び出されたときにクリーンアップされる
- クリーンアップ関数を返さない

=== effect() との比較

| 機能 | effect() | templateEffect() |
|------|----------|------------------|
| クリーンアップを返す | はい | いいえ |
| owner による自動追跡 | いいえ | はい |
| 用途 | 手動制御 | テンプレートバインディング |

== エッジケース

- createRoot 外で呼び出し → effect は動作するが追跡されない
- owner が破棄 → effect の実行が停止する

== テストケース

- effect のように動作する
- 現在の owner によって追跡される
- 現在のスコープに自動的に登録される
- スコープ外で呼び出されたときは登録されない
- dispose 後は effect が実行されない
