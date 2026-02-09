= fromTree API

#import "../../../../../SPEC/settings.typ": *
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

- テンプレートキャッシュに `WeakMap` を使用し、GC によるメモリ解放を保証
- `cloneNode(true)` による DOM クローンは、`innerHTML` パースより高速かつ予測可能
- 名前空間は呼び出し側がフラグとして指定（SVG/MathML の自動検出は行わない）
