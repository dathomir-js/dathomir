= transform/mode-ssr

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
  header: header("SSR dynamic Map のキー安定化", Status.Accepted, "2026-03-09"),
  context: [
    SSR ランタイムでは text / insert プレースホルダーが連番 ID で解決される。
  ],
  decision: [
    `renderToString` へ渡す `dynamicValues` は、まず text / insert dynamic part に 1..n の連番キーを割り当て、その後 attr / spread dynamic part を n+1 以降へ配置する。
  ],
  rationale: [
    - SSR ランタイムのマーカー参照は text / insert プレースホルダーに対する連番 ID で行われる
    - attr / spread を同じ連番に混在させると、後続 insert / text が別 ID を参照して値がずれる
  ],
)

== 機能仕様

#feature_spec(
  name: "SSR JSX transform",
  summary: [
    SSR モードで JSX を `renderToString(tree, state, new Map(...))` 呼び出しへ変換する。
  ],
  api: [
    ```typescript
    function transformJSXForSSRNode(
      node: JSXElement | JSXFragment,
      state: TransformState,
      nested: NestedTransformers,
    ): ESTNode
    ```
  ],
  constraints: [
    - `jsxToTree` の結果を `renderToString(tree, state, new Map(...))` に変換する
    - text / insert / attr / spread を動的値へ反映する
    - logical expression や JSX を含む一般式は `insert` dynamic part として扱う
    - event は SSR HTML 出力に不要のため除外する
  ],
  test_cases: [
    - `renderToString` import が登録される
    - 動的値なしで `new Map([])` を生成する
    - 動的値ありで `[1, expr]` 形式のエントリを生成する
    - event dynamic part は dynamic Map に含まれない
    - attr dynamic part が先に出現しても text / insert のキー対応が崩れない
  ],
)
