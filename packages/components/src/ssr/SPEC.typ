#import "../../../../SPEC/settings.typ": *
#show: apply-settings

= SSR DSD Renderer

== 目的

Declarative Shadow DOM を使った Web Components の SSR レンダリングを提供する。React、Vue、Next.js など、任意のフレームワークから利用可能なクロスフレームワーク API として機能する。

== API

=== renderDSD

```typescript
function renderDSD(
  target: string | ComponentClass,
  attrs?: Record<string, string>,
): string
```

カスタム要素の完全な HTML（DSD テンプレート付き）を生成する。

*パラメータ:*
- `target`: カスタム要素のタグ名（文字列）または Component Class
- `attrs`: コンポーネントに渡す属性（オプション）

*返り値:*
- `<custom-el attrs><template shadowrootmode="open">...</template></custom-el>` 形式の HTML 文字列

*例外:*
- コンポーネントが未登録の場合、`Error` を throw

*使用例:*
```typescript
const Counter = defineComponent("my-counter", ...);
const html = renderDSD(Counter, { initial: "10" });
// → '<my-counter initial="10"><template shadowrootmode="open">...</template></my-counter>'
```

=== renderDSDContent

```typescript
function renderDSDContent(
  target: string | ComponentClass,
  attrs?: Record<string, string>,
): string
```

DSD テンプレート（`<template shadowrootmode="open">...</template>`）のみを生成する。

*パラメータ:*
- `target`: カスタム要素のタグ名（文字列）または Component Class
- `attrs`: コンポーネントに渡す属性（オプション）

*返り値:*
- `<template shadowrootmode="open">...</template>` 形式の HTML 文字列

*例外:*
- コンポーネントが未登録の場合、`Error` を throw

*使用例:*
```typescript
// React で dangerouslySetInnerHTML と併用
const Counter = defineComponent("my-counter", ...);
const dsdContent = renderDSDContent(Counter, { initial: "10" });

<my-counter initial="10" dangerouslySetInnerHTML={{ __html: dsdContent }} />
```

=== ensureComponentRenderer

```typescript
function ensureComponentRenderer(): void
```

Dathomir SSR 用のグローバル ComponentRenderer をセットアップする。

*振る舞い:*
- 初回呼び出しで `setComponentRenderer(renderComponentContent)` を実行
- 2回目以降は何もしない（冪等性）
- `defineComponent` が SSR で呼ばれた際に自動実行される

*使用例:*
```typescript
// defineComponent 内部で自動呼び出し（ユーザーは意識しない）
ensureComponentRenderer();
```

=== renderComponentContent (internal)

```typescript
function renderComponentContent(
  tagName: string,
  attrs: Record<string, unknown>,
): string | null
```

DSD の内部コンテンツ（`<style>` + コンポーネント HTML）を生成する。

*パラメータ:*
- `tagName`: カスタム要素のタグ名
- `attrs`: コンポーネントに渡す属性

*返り値:*
- 登録済みの場合: `<style>...</style>` + component HTML
- 未登録の場合: `null`

*内部実装:*
1. registry から ComponentRegistration を取得
2. attrs から signal を生成し、ComponentContext を構築
3. setup 関数を呼び出し（SSR では HTML 文字列を返す）
4. CSS を `<style>` タグとして先頭に追加
5. 完全な DSD コンテンツを返す

=== escapeAttr (internal)

```typescript
function escapeAttr(value: string): string
```

属性値を HTML エスケープする（XSS 防止）。

*エスケープ対象:*
- `&` → `&amp;`
- `"` → `&quot;`
- `<` → `&lt;`
- `>` → `&gt;`

== データ構造

=== ComponentClass

```typescript
interface ComponentClass extends Function {
  readonly __tagName__: string;
}
```

`defineComponent` が返す Component Class。`__tagName__` プロパティからタグ名を自動取得できる。

== 設計決定

=== ADR-001: クロスフレームワーク対応

*決定:* `renderDSD` と `renderDSDContent` を独立した関数として提供し、Dathomir 以外のフレームワークでも使えるようにする。

*理由:*
1. React、Vue、Next.js など、任意の SSR 環境で Web Components を利用可能にする
2. Dathomir の `renderToString` に依存しない設計
3. 段階的な移行を可能にする（既存プロジェクトに Web Components のみ導入）

*影響:*
- Dathomir SSR と外部フレームワークの両方で Web Components が使える
- `renderDSD` は完全に独立した HTML 文字列を返す（Dathomir のマーカーなし）

=== ADR-002: Component Class サポート

*決定:* `renderDSD` / `renderDSDContent` の第一引数に Component Class を受け入れる。

*理由:*
1. 型安全性: タグ名の typo を防ぐ
2. リファクタリング: タグ名変更時、`defineComponent` の箇所のみ修正すれば良い
3. 開発体験: IDE が自動補完できる

*影響:*
- `defineComponent` の返り値に `__tagName__` プロパティを追加
- 文字列（タグ名）も引き続きサポート（下位互換性）

=== ADR-003: 属性の自動エスケープ

*決定:* `renderDSD` が生成する属性値を自動的に HTML エスケープする。

*理由:*
1. XSS 脆弱性の防止
2. 特殊文字（`"`, `<`, `>`, `&`）を含む属性値を安全に扱う
3. ユーザーがエスケープを意識しなくて良い

*影響:*
- `escapeAttr()` 関数で `&`, `"`, `<`, `>` をエンティティに変換
- パフォーマンスへの影響は最小限（単純な文字列置換）

=== ADR-004: ComponentRenderer の自動セットアップ

*決定:* `defineComponent` が SSR で初めて呼ばれた際、`ensureComponentRenderer()` を自動実行する。

*理由:*
1. ユーザーが `import "@dathomir/components/ssr"` を書く必要をなくす
2. ボイラープレートの削減
3. 初期化を忘れるミスを防ぐ

*影響:*
- `ensureComponentRenderer()` は冪等（複数回呼んでも安全）
- モジュールレベルの `_rendererInitialized` フラグで管理
- テスト時は `_resetRendererState()` でリセット可能

=== ADR-005: Declarative Shadow DOM の採用

*決定:* SSR HTML に `<template shadowrootmode="open">` を使用する。

*理由:*
1. Web 標準（Chrome 90+, Safari 16.4+, Firefox 123+）
2. ブラウザが自動的に Shadow DOM を構築（JavaScript 不要）
3. Hydration が高速（既存 DOM を再利用）

*影響:*
- 古いブラウザ（IE、古い Safari）は非対応
- `defineComponent` がフォールバック処理を実装（DSD 非対応時は手動で ShadowRoot 構築）

== テストケース

1. `renderDSD()` が完全な要素 HTML を生成する
2. `renderDSD()` に Component Class を渡せる
3. `renderDSD()` に tagName 文字列を渡せる（下位互換）
4. `renderDSD()` が未登録コンポーネントで例外を投げる
5. `renderDSDContent()` が DSD template のみ生成する
6. `renderDSDContent()` に Component Class を渡せる
7. `renderDSDContent()` が未登録コンポーネントで例外を投げる
8. 属性値が正しく HTML エスケープされる（`"`, `<`, `>`, `&`）
9. CSS が `<style>` タグとして DSD に含まれる
10. 複数の `<style>` タグ（複数の cssTexts）が正しく出力される
11. `ensureComponentRenderer()` が複数回呼ばれても安全（冪等性）
12. `renderComponentContent()` が未登録コンポーネントで `null` を返す

== 使用例

=== React SSR

```typescript
import { renderDSD } from "@dathomir/components/ssr";
import { Counter } from "./components/Counter";

export function App() {
  return (
    <div>
      <h1>My App</h1>
      <div dangerouslySetInnerHTML={{ __html: renderDSD(Counter, { initial: "0" }) }} />
    </div>
  );
}
```

=== Next.js App Router

```tsx
import { renderDSD } from "@dathomir/components/ssr";
import { Counter } from "@/components/Counter";

export default function Page() {
  const counterHtml = renderDSD(Counter, { initial: "5" });
  return (
    <div>
      <h1>My Page</h1>
      <div dangerouslySetInnerHTML={{ __html: counterHtml }} />
    </div>
  );
}
```

=== Vue/Nuxt SSR

```vue
<script setup lang="ts">
import { renderDSD } from "@dathomir/components/ssr";
import { Counter } from "@/components/Counter";

const counterHtml = renderDSD(Counter, { initial: "3" });
</script>

<template>
  <div>
    <h1>My Page</h1>
    <div v-html="counterHtml" />
  </div>
</template>
```
