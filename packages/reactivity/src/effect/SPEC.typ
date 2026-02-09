= effect API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

追跡された依存関係が変更されたときに再実行されるリアクティブな副作用を登録する。

== シグネチャ

```typescript
function effect(fn: () => void): EffectCleanup

type EffectCleanup = () => void;
```

== 動作

=== 実行

- effect 関数は作成時に即座に呼び出される
- 追跡された依存関係が変更されるたびに再実行される
- 依存関係の変更時に同期的に実行される（batch されていない場合）

=== クリーンアップ

- 返されたクリーンアップ関数は effect を停止する
- クリーンアップ後、effect は再実行されない
- クリーンアップはすべての追跡された依存関係を切断する

=== 依存関係の追跡

- effect 内での signal/computed の読み取りは依存関係になる
- 実行ごとに新しい依存関係を追加できる
- 古い依存関係は自動的に削除される

== エッジケース

- effect のクリーンアップは冪等（複数回呼び出しても安全）
- createRoot 内の effect は owner によって追跡される
- createRoot 外の effect は独立している

== テストケース

- 変更に反応し、クリーンアップで再実行を停止する
- peek は依存関係を追跡せずに読み取る
- 複数の更新を単一の通知にグループ化する（batch）
- 複数の連続した変更を正しく処理する
