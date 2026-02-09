= createRoot API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

effect とクリーンアップ関数を追跡するクリーンアップスコープを作成する。
コールバック内で作成されたすべての effect と templateEffect は自動的に追跡され、
返された dispose 関数が呼び出されたときに破棄される。

== シグネチャ

```typescript
function createRoot(fn: (dispose: RootDispose) => void): RootDispose

type RootDispose = () => void;

interface Owner {
  effects: (() => void)[];
  cleanups: (() => void)[];
}
```

== 動作

=== スコープの作成

- 追跡用の新しい Owner スコープを作成する
- コールバック実行中、スコープを現在の owner として設定する
- クリーンアップ用の dispose 関数を返す

=== Effect の追跡

- スコープ内の templateEffect() は自動的に追跡される
- スコープ内の effect() は自動追跡されない（独自のクリーンアップを返す）
- ネストされた createRoot スコープは親によって追跡される

=== Dispose

- dispose 関数はすべての追跡された effect をクリーンアップする
- その後、登録されたすべてのクリーンアップ関数を呼び出す
- dispose 後、スコープは空になる

=== ネスト

- ネストされた createRoot は親スコープに登録される
- 親の dispose は子の dispose をトリガーする
- 子の dispose は親に影響しない

== エッジケース

- dispose は冪等（2回呼び出しても安全）
- クリーンアップ内の例外 → 他のクリーンアップを継続
- スコープ外で呼び出し → 自動追跡なし

== テストケース

- dispose 関数を返す
- スコープ内で作成された effect を追跡してクリーンアップする
- 複数の effect を追跡する
- コールバックに dispose 関数を提供する
- ネストされた createRoot を処理する
- createRoot 外の effect は追跡しない
- 親が破棄されたときに子スコープを破棄する
- 子の破棄は親に影響しない
- 2回目の dispose 呼び出しを無視する
