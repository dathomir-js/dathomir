= text API

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

テキストノードの内容を効率的に更新する。

== 関数

=== `setText`

```typescript
function setText(node: Text, value: unknown): void
```

テキストノードの `data` プロパティを更新する。

- `null` または `undefined` の場合は空文字列に変換
- それ以外は `String(value)` で文字列に変換
- `templateEffect` 内で呼び出され、Signal 変更時に自動再実行される

== 設計判断

- `textContent` ではなく `data` プロパティを使用（テキストノード専用で効率的）
- `null`/`undefined` を空文字列にすることで、DOM に "null" や "undefined" が表示されるのを防ぐ
