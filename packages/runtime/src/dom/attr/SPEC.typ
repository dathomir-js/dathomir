= attr API

#import "/SPEC/settings.typ": *
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
- `name` が `"style"` で `value` がオブジェクトの場合は CSS 文字列に変換
  - `camelCase` → `kebab-case` へ変換（例: `borderRadius` → `border-radius`）
  - null/空文字の値を除外
  - 結果が空なら style 属性を削除
- それ以外は `String(value)` で文字列に変換して設定する

=== `setProp`

```typescript
function setProp(element: Element, name: string, value: unknown): void
```

属性では設定できない DOM プロパティを直接設定する。
`element[name] = value` による直接代入で、`value`、`checked` 等に使用する。

== 設計判断

#adr(
  header("style オブジェクトの CSS 文字列変換", Status.Accepted, "2026-02-11"),
  [
    JSX で `style={{ padding: "20px", borderRadius: "8px" }}` のように書きたい。
  ],
  [
    `setAttr` 内で style オブジェクトを検出し、CSS 文字列に変換する。
    - `typeof value === "object"` で判定（配列や null は先に処理済み）
    - `camelCase` → `kebab-case` への変換（単純な正規表現）
    - null/空文字の値は除外
    - 結果が空なら style 属性を削除
  ],
  [
    JSX の自然なスタイル記法をそのまま使えるため、別途 CSS 文字列を組み立てる必要がない。
  ],
)

- 属性とプロパティの使い分けは呼び出し側（transformer）が決定する
- `setAttr` は HTML 仕様の boolean 属性セマンティクスに従う
