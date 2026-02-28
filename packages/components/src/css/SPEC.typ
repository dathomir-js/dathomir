#import "/SPEC/settings.typ": *
#show: apply-settings

= css tagged template literal

== 目的

`css` タグ付きテンプレートリテラルを提供し、`CSSStyleSheet` を生成する。`defineComponent` の `styles` オプションで使用され、Shadow DOM の `adoptedStyleSheets` に適用される。SSR 環境では `CSSStyleSheet` API が存在しないため、生の CSS テキストを保持する `DathomirStyleSheet` オブジェクトを返す。

== API

=== css

```typescript
function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): CSSStyleSheet
```

テンプレートリテラルから `CSSStyleSheet` を生成する。

*パラメータ:*
- `strings`: テンプレート文字列の配列
- `values`: 補間された値

*返り値:*
- CSR: `CSSStyleSheet` インスタンス（`__cssText` プロパティ付き）
- SSR: `DathomirStyleSheet` オブジェクト（`__cssText` のみ保持）

*振る舞い:*
- テンプレートリテラルの各パーツと補間値を結合して CSS テキストを構築
- SSR 環境（`typeof CSSStyleSheet === "undefined"`）では `{ __cssText: result }` を返す
- CSR 環境では `new CSSStyleSheet()` を作成し、`replaceSync()` で CSS を適用
- 生の CSS テキストを `__cssText` プロパティに保存（DSD 出力用）

=== getCssText

```typescript
function getCssText(
  sheet: CSSStyleSheet | string
): string | undefined
```

`CSSStyleSheet` または `DathomirStyleSheet` から生の CSS テキストを抽出する。

*パラメータ:*
- `sheet`: `CSSStyleSheet`、`DathomirStyleSheet`、または CSS 文字列

*返り値:*
- 文字列が渡された場合: その文字列をそのまま返す
- `__cssText` プロパティがある場合: その値を返す
- それ以外: `undefined`

== データ構造

=== DathomirStyleSheet

```typescript
interface DathomirStyleSheet extends CSSStyleSheet {
  __cssText: string;
}
```

SSR 互換のスタイルシートインターフェース。`CSSStyleSheet` を拡張し、生の CSS テキストを保持する。

*フィールド:*
- `__cssText`: DSD `<style>` 出力用の生 CSS テキスト

== 設計決定

=== ADR-001: CSSStyleSheet + __cssText の二重保持

*決定:* CSR 環境でも `__cssText` プロパティに生の CSS テキストを保存する。

*理由:*
1. SSR で DSD `<style>` タグを生成する際に CSS テキストが必要
2. `CSSStyleSheet` API からは生のテキストを簡単に取得できない
3. CSR と SSR の両方で一貫した API を提供

*影響:*
- メモリ使用量が若干増加するが、CSS テキストは通常小さい
- DSD 生成時に `getCssText()` で安全に取得可能

=== ADR-002: SSR 環境でのフォールバック

*決定:* SSR 環境では `CSSStyleSheet` の代わりに `{ __cssText }` オブジェクトを返す。

*理由:*
1. Node.js には `CSSStyleSheet` API が存在しない
2. SSR では実際のスタイルシート操作は不要
3. 型安全性を維持しつつ SSR をサポート

*影響:*
- SSR コードは `getCssText()` を使って CSS テキストを取得する
- 返り値の型は `CSSStyleSheet` だが、SSR では実際には異なるオブジェクト

== テストケース

1. `CSSStyleSheet` インスタンスを返す
2. 補間値を正しく処理する
3. 空のスタイルを処理する
4. 複数の補間を処理する
5. `getCssText()` が `__cssText` を返す
6. `getCssText()` が文字列をそのまま返す
