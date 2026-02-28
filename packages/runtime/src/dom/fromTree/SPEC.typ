= fromTree API

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

構造化配列（Tree）から DOM フラグメントを生成するファクトリ関数を提供する。Svelte 5 の `from_tree` アプローチに基づく。

== 関数

=== `fromTree`

```typescript
function fromTree(
  structure: readonly Tree[],
  flags?: Namespace
): () => DocumentFragment
```

構造化配列から DOM を生成するファクトリ関数を返す。

- `WeakMap` によるテンプレートキャッシュで、2回目以降は `cloneNode(true)` による高速クローン
- プレースホルダー（`{text}`、`{insert}`、`{each}` 等）はスキップし、静的部分のみ生成
- `flags` で名前空間を指定（HTML=0、SVG=1、MathML=2）

== 型定義

構造化配列の型は `@/types/tree` で定義：

- `Tree`: `TreeNode | TextContent | Placeholder`
- `TreeNode`: `[tag: string, attrs: Attrs | null, ...children: Tree[]]`
- `Placeholder`: `[type: PlaceholderType, id: number | null]`
- `Namespace`: `enum { HTML = 0, SVG = 1, MathML = 2 }`

== 設計判断

#adr(
  header("SVG/MathML 名前空間の自動検出", Status.Accepted, "2026-02-11"),
  [
    呼び出し側で名前空間を手動指定するのは煩雑。
  ],
  [
    `<svg>` タグと `<math>` タグで自動的に名前空間を切り替える。
    - `tag === "svg"` → `Namespace.SVG`
    - `tag === "math"` → `Namespace.MathML`
    - 子要素のレンダリング後、親の名前空間に復元
    - これにより、`<div><svg>...</svg></div>` のような混在構造も正しく動作
  ],
  [
    transformer の生成コードで名前空間を意識する必要がなく、コードが簡潔になる。
  ],
)

#adr(
  header("style オブジェクトのサポート", Status.Accepted, "2026-02-11"),
  [
    JSX で `style={{ padding: "20px", borderRadius: "8px" }}` のように書きたい。
  ],
  [
    属性設定時に style オブジェクトを検出し、CSS 文字列に変換。
    - `camelCase` → `kebab-case` への変換
    - null/空文字の値を除外
    - 結果が空なら style 属性を設定しない
  ],
  [
    JSX の自然なスタイル記法をそのまま使えるため、別途 CSS 文字列を組み立てる必要がない。
  ],
)

- テンプレートキャッシュに `WeakMap` を使用し、GC によるメモリ解放を保証
- `cloneNode(true)` による DOM クローンは、`innerHTML` パースより高速かつ予測可能
