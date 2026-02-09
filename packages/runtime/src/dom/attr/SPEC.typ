= attr API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

DOM 要素の属性とプロパティを設定するユーティリティ関数を提供する。

== 関数

=== `setAttr`

```typescript
function setAttr(element: Element, name: string, value: unknown): void
```

要素の属性を設定する。

- `null`、`undefined`、`false` の場合は属性を削除する
- `true` の場合は空文字列として設定する（boolean 属性）
- それ以外は `String(value)` で文字列に変換して設定する

=== `setProp`

```typescript
function setProp(element: Element, name: string, value: unknown): void
```

属性では設定できない DOM プロパティを直接設定する。
`element[name] = value` による直接代入で、`value`、`checked` 等に使用する。

== 設計判断

- 属性とプロパティの使い分けは呼び出し側（transformer）が決定する
- `setAttr` は HTML 仕様の boolean 属性セマンティクスに従う
