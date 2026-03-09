#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= SSR DSD Renderer

== 目的

Declarative Shadow DOM を使った Web Components の SSR レンダリングを提供する。React、Vue、Next.js など、任意のフレームワークから利用可能なクロスフレームワーク API として機能する。

== インターフェース仕様

#interface_spec(
  name: "SSR renderer API",
  summary: [
    Web Component を Declarative Shadow DOM 付きの HTML 文字列として SSR 出力する API 群。
  ],
  format: [
    ```typescript
    function renderDSD(
      target: string | ComponentClass,
      attrs?: Record<string, string>,
    ): string

    function renderDSDContent(
      target: string | ComponentClass,
      attrs?: Record<string, string>,
    ): string

    function ensureComponentRenderer(): void

    function renderComponentContent(
      tagName: string,
      attrs: Record<string, unknown>,
    ): string | null

    function escapeAttr(value: string): string

    interface ComponentClass extends Function {
      readonly __tagName__: string;
    }
    ```
  ],
  constraints: [
    - `renderDSD()` は `<custom-el><template shadowrootmode="open">...</template></custom-el>` を返す
    - `renderDSDContent()` は template 部分のみ返す
    - 未登録コンポーネントでは `renderDSD()` と `renderDSDContent()` は例外を投げる
    - `ensureComponentRenderer()` は冪等である
    - `renderComponentContent()` は未登録時に `null` を返す
    - `escapeAttr()` は `&`, `"`, `<`, `>` を HTML エスケープする
  ],
)

== 機能仕様

#feature_spec(
  name: "DSD rendering",
  summary: [
    registry 上の ComponentRegistration を参照し、属性値の型変換と CSS 付与を行ったうえで DSD HTML を生成する。
  ],
  test_cases: [
    1. `renderDSD()` が完全な要素 HTML を生成する
    2. `renderDSD()` に Component Class を渡せる
    3. `renderDSD()` に tagName 文字列を渡せる
    4. `renderDSD()` が未登録コンポーネントで例外を投げる
    5. `renderDSDContent()` が DSD template のみ生成する
    6. `renderDSDContent()` に Component Class を渡せる
    7. `renderDSDContent()` が未登録コンポーネントで例外を投げる
    8. 属性値が正しく HTML エスケープされる
    9. CSS が `<style>` タグとして DSD に含まれる
    10. 複数の `<style>` タグが正しく出力される
    11. `ensureComponentRenderer()` が複数回呼ばれても安全である
    12. `renderComponentContent()` が未登録コンポーネントで `null` を返す
    13. `Number` 型プロップで `null` 属性はデフォルト値を使う
    14. `String` 型プロップで `null` 属性はデフォルト値を使う
  ],
  impl_notes: [
    *使用例*:
    - React/Next.js/Vue などから `renderDSD()` または `renderDSDContent()` を直接呼び出せる
    - `defineComponent` が SSR で初回評価された際に `ensureComponentRenderer()` を自動実行する
  ],
)

== 設計判断

#adr(
  header("クロスフレームワーク対応", Status.Accepted, "2026-03-09"),
  [
    Dathomir 以外の SSR 環境でも Web Components を利用できるようにする必要がある。
  ],
  [
    `renderDSD` と `renderDSDContent` を独立した API として提供する。
  ],
  [
    - React、Vue、Next.js などでも利用できる
    - Dathomir の `renderToString` に依存しない
  ],
)

#adr(
  header("Component Class サポート", Status.Accepted, "2026-03-09"),
  [
    タグ名文字列だけだと typo が起きやすく、リファクタリングも弱い。
  ],
  [
    `renderDSD` / `renderDSDContent` の第一引数に Component Class を受け入れる。
  ],
  [
    - `__tagName__` からタグ名を安全に取得できる
    - 文字列指定も下位互換として残す
  ],
)

#adr(
  header("属性の自動エスケープ", Status.Accepted, "2026-03-09"),
  [
    SSR で文字列連結により HTML を生成するため、属性値の XSS 対策が必要である。
  ],
  [
    `renderDSD` が生成する属性値を自動的に HTML エスケープする。
  ],
  [
    - `escapeAttr()` で `&`, `"`, `<`, `>` を変換する
    - 利用者が個別にエスケープを意識しなくてよい
  ],
)

#adr(
  header("ComponentRenderer の自動セットアップ", Status.Accepted, "2026-03-09"),
  [
    SSR 初期化を利用者に委ねると、セットアップ忘れが起きやすい。
  ],
  [
    `defineComponent` が SSR で初めて呼ばれた際に `ensureComponentRenderer()` を自動実行する。
  ],
  [
    - ボイラープレートが減る
    - `_rendererInitialized` による冪等制御が必要になる
  ],
)

#adr(
  header("Declarative Shadow DOM の採用", Status.Accepted, "2026-03-09"),
  [
    SSR HTML からブラウザが直接 Shadow DOM を構築できる仕組みが必要である。
  ],
  [
    SSR HTML に `<template shadowrootmode="open">` を使用する。
  ],
  [
    - JavaScript なしで Shadow DOM を構築できる
    - Hydration で既存 DOM を再利用しやすい
    - 古いブラウザでは defineComponent 側のフォールバックが必要
  ],
)

#adr(
  header("SSR における属性→プロップ型変換", Status.Accepted, "2026-03-09"),
  [
    CSR と SSR で属性値の解釈が一致しないと Hydration Mismatch が発生する。
  ],
  [
    SSR の `coerceForSSR` は CSR の `coerceValue` と同じ型変換ルールに従う。
  ],
  [
    - `Boolean`: 属性存在で `true`、不在で `false`
    - `Number` と `String`: `null` ならデフォルト値にフォールバック
    - カスタム関数は `null` を含めてそのまま渡す
  ],
)

#adr(
  header("createComponentRenderer と _resetRendererState", Status.Accepted, "2026-03-09"),
  [
    テストや将来のレンダラー差し替えに向けて、内部初期化状態とレンダラー生成を個別に扱う必要がある。
  ],
  [
    `createComponentRenderer` と `_resetRendererState` を内部向け API としてエクスポートする。
  ],
  [
    - テスト間で状態を確実に分離できる
    - 将来のカスタムレンダラー注入点になる
  ],
)
