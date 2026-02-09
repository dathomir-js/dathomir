= events API

#import "../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

DOM イベントリスナーを登録し、`createRoot` スコープの破棄時に自動でクリーンアップする。

== 関数

=== `event`

```typescript
function event(
  type: string,
  element: Element,
  handler: EventListener
): void
```

要素にイベントリスナーを登録する。

- `addEventListener` でリスナーを追加
- `onCleanup` を使用して、`createRoot` スコープ破棄時に `removeEventListener` を自動実行
- Transformer が生成するコードから呼び出される

== 設計判断

- `onCleanup` による自動クリーンアップで、メモリリークを防止
- イベント委譲（delegation）は使用しない（Web Components の Shadow DOM 境界と相性が悪い）
- `createRoot` スコープ外で呼ばれた場合でもリスナーは登録されるが、自動クリーンアップは行われない
