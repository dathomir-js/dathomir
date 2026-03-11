#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= withStore API

== 目的

root render と nested subtree の両方で同じ記法を使い、明示的な store boundary を構築できるようにする。

== 機能仕様

#feature_spec(
  name: "withStore",
  summary: [
    `render` callback を特定の `AtomStore` 境界の中で評価する boundary primitive。`mount()` / `hydrate()` の root boundary と nested subtree override の両方で共通に使う。
  ],
  api: [
    ```typescript
    function withStore<T>(store: AtomStore, render: () => T): T;

    function getCurrentStore(): AtomStore | undefined;
    ```

    *boundary semantics*:
    - `withStore(store, render)` は `render()` を同期的に評価する
    - callback 内で生成された Dathomir subtree は `store` を継承する
    - nested `withStore()` は内側の store を優先する

    *usage*:
    - root boundary: `mount(root, withStore(store, () => <App />))`
    - nested boundary: `return withStore(store.fork(...), () => <Subtree />)`

    *introspection semantics*:
    - `getCurrentStore()` は現在 active な同期 store boundary を返す
    - boundary 外では `undefined` を返す
  ],
  edge_cases: [
    - `withStore()` は非同期継承を行わない
    - callback を抜けた後は外側の store boundary に戻る
    - boundary 外で store-required API を呼ぶ場合は開発時に fail-fast できる設計を優先する
  ],
  test_cases: [
    - root render で `withStore()` を使って store boundary を作成する
    - nested `withStore()` が内側優先で store を切り替える
    - callback 終了後に外側の store boundary が復元される
    - 非同期 callback に store boundary が暗黙に伝播しない
    - `fork()` した child store を nested boundary に適用できる
  ],
)

== 設計判断

#adr(
  header("store boundary の primitive は withStore に統一する", Status.Accepted, "2026-03-10"),
  [
    root mount と nested subtree override で別々の boundary API を持つと、store 伝播の mental model が分裂する。
  ],
  [
    root・nested の両方で `withStore(store, render)` を store boundary の共通 primitive とする。
  ],
  [
    - `mount()` / `hydrate()` の書き方と subtree override の書き方を揃えられる
    - store 伝播の開始地点がコード上で明示される
    - context lookup を導入せずに boundary を表現できる
  ],
)

#adr(
  header("withStore は同期 boundary に限定する", Status.Accepted, "2026-03-10"),
  [
    async context propagation まで含めると、runtime 状態管理が複雑になり、store boundary の予測可能性が下がる。
  ],
  [
    `withStore()` は同期的な render boundary に限定し、非同期 callback への暗黙伝播は行わない。
  ],
  [
    - 実行モデルが単純になる
    - boundary の有効範囲を AST と callsite で把握しやすい
    - 非同期文脈で store が必要な場合は明示的に渡す設計を促せる
  ],
)
