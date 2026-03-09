#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= css tagged template literal

== 目的

`css` タグ付きテンプレートリテラルを提供し、`CSSStyleSheet` を生成する。`defineComponent` の `styles` オプションで使用され、Shadow DOM の `adoptedStyleSheets` に適用される。SSR 環境では `CSSStyleSheet` API が存在しないため、生の CSS テキストを保持する `DathomirStyleSheet` オブジェクトを返す。

== インターフェース仕様

#interface_spec(
  name: "css / getCssText API",
  summary: [
    CSS テンプレート文字列を `CSSStyleSheet` または SSR 互換オブジェクトへ変換し、生の CSS テキストを抽出する API。
  ],
  format: [
    ```typescript
    function css(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): CSSStyleSheet

    function getCssText(
      sheet: CSSStyleSheet | string
    ): string | undefined

    interface DathomirStyleSheet extends CSSStyleSheet {
      __cssText: string;
    }
    ```
  ],
  constraints: [
    - `css()` はテンプレート文字列と補間値を結合して CSS テキストを構築する
    - CSR では `new CSSStyleSheet()` を作成し、`replaceSync()` で適用する
    - SSR では `{ __cssText }` を返す
    - `getCssText()` は文字列をそのまま返し、`__cssText` があればその値を返す
  ],
)

== 機能仕様

#feature_spec(
  name: "stylesheet generation",
  summary: [
    CSR では `CSSStyleSheet` を、SSR では `__cssText` を持つ互換オブジェクトを返し、両環境で同じ入力 API を提供する。
  ],
  test_cases: [
    1. `CSSStyleSheet` インスタンスを返す
    2. 補間値を正しく処理する
    3. 空のスタイルを処理する
    4. 複数の補間を処理する
    5. `getCssText()` が `__cssText` を返す
    6. `getCssText()` が文字列をそのまま返す
  ],
)

== 設計判断

#adr(
  header("CSSStyleSheet + __cssText の二重保持", Status.Accepted, "2026-03-09"),
  [
    SSR では Declarative Shadow DOM の `<style>` 出力に生の CSS テキストが必要だが、`CSSStyleSheet` API からは容易に復元できない。
  ],
  [
    CSR 環境でも `__cssText` プロパティに元の CSS テキストを保持する。
  ],
  [
    - CSR と SSR で一貫した API を保てる
    - メモリ使用量はわずかに増えるが DSD 出力が容易になる
  ],
)

#adr(
  header("SSR 環境でのフォールバック", Status.Accepted, "2026-03-09"),
  [
    Node.js などの SSR 環境には `CSSStyleSheet` API が存在しない。
  ],
  [
    SSR では `CSSStyleSheet` の代わりに `{ __cssText }` オブジェクトを返す。
  ],
  [
    - SSR でも同じ `css()` API を使える
    - `getCssText()` で安全に CSS テキストを取得できる
  ],
)
