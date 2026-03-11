#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= defineAtomStoreSnapshot API

== 目的

SSR と hydration 間で transfer する atom 値を静的に列挙し、AST で追跡しやすい明示 snapshot schema を提供する。

== 機能仕様

#feature_spec(
  name: "defineAtomStoreSnapshot",
  summary: [
    primitive atom のみを対象にした snapshot schema を定義し、`AtomStore` の現在値を serialize-friendly な plain object として読み書きできるようにする。
  ],
  api: [
    ```typescript
    type AtomStoreSnapshotSchema = Record<string, PrimitiveAtom<unknown>>;

    function defineAtomStoreSnapshot<const S extends AtomStoreSnapshotSchema>(
      schema: S,
    ): AtomStoreSnapshot<S>;

    interface AtomStoreSnapshot<S extends AtomStoreSnapshotSchema> {
      readonly schema: Readonly<S>;
      serialize(store: AtomStore): AtomStoreSnapshotValue<S>;
      values(
        snapshot: AtomStoreSnapshotValue<S>,
      ): Iterable<readonly [S[keyof S], unknown]>;
      hydrate(store: AtomStore, snapshot: AtomStoreSnapshotValue<S>): void;
    }

    type AtomStoreSnapshotValue<S extends AtomStoreSnapshotSchema> = {
      readonly [K in keyof S]: InferPrimitiveAtomValue<S[K]>;
    };
    ```

    *snapshot semantics*:
    - schema は stable id を key、primitive atom 定義を value に持つ object literal とする
    - `serialize(store)` は schema に列挙された atom の現在値だけを plain object として返す
    - `values(snapshot)` は `createAtomStore({ values })` に渡せる iterable を返す
    - `hydrate(store, snapshot)` は schema に列挙された atom の値を既存 store に流し込む

    *transfer semantics*:
    - 対象は primitive atom のみとする
    - derived atom は snapshot 対象に含めない
    - schema に列挙されていない atom は transfer 対象外とする

    *integration semantics*:
    - `serialize(store)` の返り値は plain object として `serializeState()` / `deserializeState()` と往復可能な shape を保つ
  ],
  edge_cases: [
    - atom identity は object reference を使用し、snapshot の key 文字列で atom identity を決めない
    - schema の key は wire format 上の stable id として扱う
    - 非 serializable な値は runtime の serialize layer で拒否できる形を保つ
    - schema に derived atom が含まれる場合は fail-fast できる設計を優先する
    - `fork()` した store に対する `serialize()` は、その store から見える現在値を平坦化して返す
    - 初期バージョンでは store tree や fork 構造の完全復元は行わない
  ],
  test_cases: [
    - schema に列挙した primitive atom の現在値だけを serialize する
    - `values(snapshot)` が `createAtomStore({ values })` に渡せる
    - `hydrate(store, snapshot)` が既存 store を更新する
    - 同じ atom 定義を別 store で serialize しても値は store ごとに分離される
    - `fork()` store を serialize すると child から見える値で平坦化される
    - schema の key と atom.key が一致しなくても snapshot は schema key を使用する
    - schema を `serializeState()` / `deserializeState()` と組み合わせて round-trip できる
    - derived atom を schema に含めるとエラーになる
  ],
)

== 設計判断

#adr(
  header("snapshot 対象は schema に明示列挙する", Status.Accepted, "2026-03-10"),
  [
    store 内の全 atom を自動収集すると、何が transfer 対象かを AST や code review で把握しにくくなる。
  ],
  [
    `defineAtomStoreSnapshot({ stableId: atom })` で transfer 対象を明示列挙する schema 方式を採用する。
  ],
  [
    - どの atom が transfer 対象か静的に追跡しやすい
    - SSR payload の surface を意図的に制御できる
    - lint / codemod / ドキュメント生成との相性が良い
  ],
)

#adr(
  header("snapshot identity は atom.key ではなく schema key を使う", Status.Accepted, "2026-03-10"),
  [
    `atom.key` は診断補助用であり、wire format の stable identity にそのまま使うと key 重複や rename の扱いが曖昧になる。
  ],
  [
    snapshot の stable identity は schema object の key に限定し、atom identity 自体は object reference で維持する。
  ],
  [
    - snapshot payload の名前を意図的に設計できる
    - atom.key の変更と wire format の変更を分離できる
    - atom identity の既存設計を壊さない
  ],
)

#adr(
  header("初期 snapshot は primitive atom の値だけを平坦化する", Status.Accepted, "2026-03-10"),
  [
    derived atom や fork tree 全体の構造まで snapshot 対象にすると、serialize format と hydration 復元ロジックが複雑になる。
  ],
  [
    初期バージョンでは primitive atom の現在値だけを対象とし、derived atom は hydration 後に再計算する。fork store は child から見える値を平坦化して serialize する。
  ],
  [
    - snapshot format を単純に保てる
    - SSR/hydration の初期統合コストを抑えられる
    - derived cache や fork graph の内部構造を wire format に漏らさずに済む
  ],
)
