= render API

#import "../../../../../SPEC/settings.typ": *
#show: apply-settings

== 目的

構造化配列（Tree）を SSR 用の HTML 文字列にレンダリングする。

== 関数

=== `renderTree`

```typescript
function renderTree(tree: Tree[], options?: RenderOptions): string
```

構造化配列を HTML 文字列にレンダリングする。マーカーを自動挿入し、Hydration に対応した出力を生成する。

=== `renderToString`

```typescript
function renderToString(
  tree: Tree[],
  state?: StateObject,
  dynamicValues?: Map<number, unknown>
): string
```

状態付きの完全な HTML 文字列を生成する便利メソッド。`renderTree` + 状態スクリプトの挿入を行う。

=== `createContext`

```typescript
function createContext(options?: RenderOptions): RenderContext
```

レンダリングコンテキストを生成する。マーカー ID のカウンターや状態を管理する。

== 型定義

```typescript
interface RenderContext {
  markerId: number;
  state: StateObject | null;
  dynamicValues: Map<number, unknown> | null;
  namespace: Namespace;
}

interface RenderOptions {
  state?: StateObject;
  dynamicValues?: Map<number, unknown>;
  includeState?: boolean;
}
```

== 内部処理

- `escapeHtml`: XSS 防止のための HTML エスケープ
- `escapeAttr`: 属性値のエスケープ
- `renderAttrs`: 属性のレンダリング（boolean 属性対応）
- Void 要素（`<br>`、`<img>` 等）の閉じタグ省略
- SVG 名前空間の自動切り替え

== 設計判断

- Web 標準 API のみ使用（Node.js 依存ゼロ）
- HTML エスケープは最小限の置換で実装（バンドルサイズ考慮）
- プレースホルダーはマーカーに変換し、動的値があれば埋め込む
