= signal API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

読み取りを追跡し、更新時に依存先へ通知するミュータブルなリアクティブシグナルを作成する。

== シグネチャ

```typescript
function signal<T>(initialValue: T): Signal<T>

interface Signal<T> {
  readonly value: T;                     // 追跡付きで読み取り専用
  set(update: T | ((prev: T) => T)): void;
  peek(): T;                             // 追跡なしで読み取り
  readonly __type__: "signal";
}
```

== 動作

=== 読み取り

- `signal.value` は現在の値を返し、依存関係を追跡する
- `signal.peek()` は追跡せずに現在の値を返す

=== 書き込み

- `signal.value` への直接代入（`signal.value = x`）は *禁止*（`readonly`）
- `signal.set(value)` は値または更新関数を受け取る
- `Object.is()` を使用して等価性をチェック（NaN を正しく扱う）

=== ADR: `.value` 書き込み禁止・`update()` 廃止

*決定:* `signal.value` を読み取り専用にし、書き込みは `set()` のみとする。`update()` は廃止。

*理由:*
1. `set()` が値もアップデータ関数も受け取れるため `update()` は完全に冗長
2. API をシンプルにすることで学習コストを下げ、DX を向上させる
3. `.value++` 等の暗黙的な read-modify-write パターンを排除し、コードの意図を明確化
4. TypeScript の `readonly` により、コンパイル時にエラーが検出される

=== 通知

- batch されていない限り、依存先は同期的に通知される
- batch 内での複数回の書き込みは単一の通知になる

== エッジケース

- NaN === NaN（誤った更新なし）
- 同じ値を設定 = 通知なし
- effect 内で読み取り = 依存関係が登録される
- effect 外で読み取り = 追跡なし

== テストケース

- 初期値を正しく設定する
- .value 経由で読み取る
- .value への直接代入が TypeScript でエラーになる
- set() で直接値を更新する
- set() で関数を使って更新する
- effect 内で .value を読み取ると依存関係を登録する
- computed 内で .value を読み取ると依存関係を登録する
- peek() を使用すると依存関係を登録しない
- 値が変更されたときのみ effect が再実行される
- 同じ値を設定しても effect は再実行されない
- Object.is を使用して NaN を正しく扱う
