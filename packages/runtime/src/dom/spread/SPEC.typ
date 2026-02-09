= spread API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

動的な props オブジェクトの差分を計算し、変更された属性のみを DOM に適用する。

== 関数

=== `spread`

```typescript
function spread(
  element: Element,
  prev: SpreadProps | null,
  next: SpreadProps
): SpreadProps
```

前回の props と今回の props の差分を取り、変更のみを適用する。
戻り値を次回呼び出しの `prev` として使用する。

== 型定義

```typescript
type SpreadProps = Record<string, unknown>
```

== 動作仕様

- 新しいキーは `setAttr` で設定
- 削除されたキーは `setAttr(element, key, null)` で削除
- イベントハンドラ（`on` + 大文字で始まるキー、値が関数）は `addEventListener`/`removeEventListener` で管理
- `WeakMap` で要素ごとのイベントハンドラを追跡

== イベントハンドラ判定

```typescript
key.startsWith("on") && key.length > 2 && typeof value === "function"
```

== 設計判断

- `prev` を戻り値として返すことで、外部状態管理を不要にする
- `WeakMap` でイベントハンドラを管理し、GC によるメモリ解放を保証
- `setAttr` を内部で使用し、属性設定ロジックを重複させない
