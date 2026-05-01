= ssr

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

Dathra アプリケーションを SSR で使い始めるための公開 API を提供する。
低レベルな `@dathra/components/ssr` の `renderDSD` を直接利用者に要求せず、
`@dathra/core/ssr` から短い導線で Declarative Shadow DOM HTML を生成できるようにする。

== インターフェース仕様

#interface_spec(
  name: "core SSR API",
  summary: [
    `@dathra/core/ssr` は `render()` を公開し、Dathra component または custom element tag を SSR HTML へ変換する。
  ],
  format: [
    *エクスポート*:
    - `render(...args: Parameters<typeof renderDSD>): ReturnType<typeof renderDSD>`

    *使用例*:
    ```typescript
    import { render } from "@dathra/core/ssr";
    import { App } from "./App";

    export default () => render(App);
    ```
  ],
  constraints: [
    - `render()` は `@dathra/components/ssr` の `renderDSD()` と同じ引数を受け付ける
    - `render()` は `renderDSD()` の戻り値をそのまま返す
    - store などの SSR option は `renderDSD()` に透過的に渡す
  ],
)

== 機能仕様

#feature_spec(
  name: "SSR convenience render",
  summary: [
    SSR entry から `renderDSD` を直接 import しなくても DSD HTML を生成できる。
  ],
  test_cases: [
    - `render()` が `renderDSD()` に引数を透過的に渡す
    - `render()` が `renderDSD()` の戻り値を返す
  ],
)
