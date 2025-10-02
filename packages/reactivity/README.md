# @ailuros/reactivity

`@ailuros/reactivity` は [`alien-signals`](https://github.com/stackblitz/alien-signals) の低レベル API（`alien-signals/system`）を土台にしたリアクティビティ層です。TC39 Signals 提案に近い `signal` / `computed` / `effect` インターフェイスを提供し、設定なしで軽量・高速なリアクティビティを構築できます。

## 特徴

- `signal` は `.value` プロパティと `set` / `update` メソッドを備えたオブジェクトを生成します。
- `computed` は依存するシグナルに追従し、自動的に再計算される `value` を提供します。
- `effect` は依存するシグナルの変化を監視し、副作用を実行します。戻り値のクリーンアップ関数で停止可能です。
- `batch` で複数更新をまとめて通知できます。
- `peek()` でトラッキングなしに現在値へアクセスできます。

## 使い方

```ts
import { signal, computed, effect, batch } from '@ailuros/reactivity';

const count = signal(0);
const doubled = computed(() => count.value * 2);

const stop = effect(() => {
  console.log(`${count.value} is effected`);
});

console.log(doubled.value); // 0

count.set(prev => prev + 1);
console.log(count.value);   // 1
console.log(doubled.value); // 2

batch(() => {
  count.value = 5;
  count.value = 10;
});

stop();
```

## 信号 API

### `signal(initialValue)`

- `value`: 現在値（getter/setter 両対応）
- `set(next)`:
  - 直接値、または `(prev) => next` 形式の更新関数を渡せます。
- `update(updater)`:
  - `set` の関数呼び出し版。返り値はなく、値を更新します。
- `peek()`:
  - 依存関係をトラッキングせずに現在値を取得します。

### `computed(getter)`

- `value`: 最新の計算結果。
- `peek()`: トラッキングなしで現在値を取得。

### `effect(callback)`

- 依存するシグナルが更新されるたびに `callback` を再実行します。
- 戻り値はクリーンアップ関数。呼び出すとエフェクトが停止します。

### `batch(fn)`

- `fn` 内の更新通知を遅延させ、一括で再計算を行います。

## 実装メモ

- `createReactiveSystem` を介して `alien-signals` の伝播アルゴリズムを再利用しています。
- 追加した `Signal` / `Computed` / `Effect` は `kind` フラグを持ち、`alien-signals` のフラグ管理と共存するよう調整しています。
- `peek()` は内部的にトラッキングを無効化することで副作用を発生させず安全に値を読み取ります。

## ライセンス

本パッケージは MPL-2.0 ライセンスに基づいて提供されます。内部で使用している `alien-signals` は MIT ライセンスです。
