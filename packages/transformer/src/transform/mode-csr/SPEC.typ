= transform/mode-csr

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 設計判断

#adr(
  header: header("dynamic part ノード参照の先行解決", Status.Accepted, "2026-03-09"),
  context: [
    CSR 変換では dynamic part の副作用実行で DOM 構造が変化しうる。
  ],
  decision: [
    `generateNavigation` による `nodeId` 解決は `templateEffect` / `insert` / `event` の実処理より先に行う。
  ],
  rationale: [
    - `templateEffect` は登録時に即時実行されるため、先に insert が走ると DOM 構造が変化する
    - 変化後に次のパスを辿ると隣接 placeholder を取り違える可能性がある
  ],
)

== 機能仕様

#feature_spec(
  name: "CSR JSX transform",
  summary: [
    CSR モードで JSX をテンプレート生成と dynamic part 更新処理へ変換する。
  ],
  api: [
    ```typescript
    function transformJSXNode(
      node: JSXElement | JSXFragment,
      state: TransformState,
      nested: NestedTransformers,
    ): ESTNode
    ```
  ],
  constraints: [
    - `fromTree()` には compiler-generated な static template descriptor を渡してテンプレートを作成する
    - dynamic parts に応じて `setText`, `setAttr`, `event`, `spread`, `insert` を生成する
    - コンポーネント insert は `templateEffect` でラップしない
    - 条件式 / map / logical expression / JSX を含む一般式 / `JSXSpreadChild` は動的 insert として扱う
    - reactive access を含まない attr dynamic part は `templateEffect` なしで `setAttr()` を 1 回だけ実行する
  ],
  test_cases: [
    - 静的要素が compiler-generated template descriptor + IIFE + fragment return に変換される
    - static template descriptor には pre-serialized markup が含まれる
    - text / attr が `templateEffect` を使用する
    - static attr expression は `templateEffect` なしで `setAttr()` を使用する
    - event が `event(type, node, handler)` で生成される
    - component insert は `templateEffect` なし
    - dynamic insert は `templateEffect` あり
    - 複数 insert dynamic part があっても参照ノード解決がずれない
  ],
)
