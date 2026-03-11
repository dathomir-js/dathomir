#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

= atom API

== 目的

store instance から独立した atom 定義を作成し、静的 import で追跡しやすい共有状態グラフを構築できるようにする。

== 機能仕様

#feature_spec(
  name: "atom",
  summary: [
    primitive atom と derived atom を宣言するための定義 API。atom 自体は値を保持せず、値の実体は `createAtomStore()` が管理する。
  ],
  api: [
    ```typescript
    type Getter = <T>(atom: ReadableAtom<T>) => T;

    function atom<T>(key: string, initialValue: T): PrimitiveAtom<T>;
    function atom<T>(key: string, read: (get: Getter) => T): DerivedAtom<T>;

    interface PrimitiveAtom<T> {
      readonly key: string;
      readonly kind: "primitive";
      readonly init: T;
    }

    interface DerivedAtom<T> {
      readonly key: string;
      readonly kind: "derived";
      readonly read: (get: Getter) => T;
    }

    type ReadableAtom<T> = PrimitiveAtom<T> | DerivedAtom<T>;
    type WritableAtom<T> = PrimitiveAtom<T>;
    ```

    *primitive atom*:
    - `atom(key, initialValue)` は writable な atom 定義を返す
    - 値の実体は store ごとに保持する
    - 第 2 引数が関数の場合は primitive value ではなく derived getter として解釈する

    *derived atom*:
    - `atom(key, read)` は read-only な atom 定義を返す
    - `read(get)` は同一 store 内の他 atom 値から派生値を計算する
  ],
  edge_cases: [
    - atom 定義は値を保持しない
    - derived atom は初期バージョンでは write API を持たない
    - 初期バージョンでは function-valued primitive atom はサポートしない
    - `key` は診断・シリアライズ補助用であり、atom identity は object reference で判定する
    - `read(get)` は同期関数のみを対象とし、非同期 atom は初期バージョンの対象外とする
  ],
  test_cases: [
    - `atom(key, initialValue)` が primitive atom 定義を返す
    - `atom(key, read)` が derived atom 定義を返す
    - primitive atom は `kind === "primitive"` を持つ
    - derived atom は `kind === "derived"` を持つ
    - atom 定義を複数 store で共有しても値実体は共有しない
    - derived atom が `get()` を通じて他 atom を参照できる
    - derived atom が write API を持たない
  ],
)

== 設計判断

#adr(
  header("atom は store 非依存の定義に限定する", Status.Accepted, "2026-03-10"),
  [
    module global に state instance を置くと、SSR request 間リークや複数 app root 間の意図しない共有が発生しやすい。
  ],
  [
    atom は store から独立した定義 object とし、値の実体は `createAtomStore()` 側で保持する。
  ],
  [
    - atom は静的 import で追跡しやすくなる
    - 共有境界は store instance 側で明示的に管理できる
    - atom 定義は安全に module scope で共有できる
  ],
)

#adr(
  header("初期バージョンの derived atom は read-only に限定する", Status.Accepted, "2026-03-10"),
  [
    writable derived atom まで初期 API に含めると、書き込み経路と型分岐が増えて仕様が複雑になる。
  ],
  [
    初期バージョンでは primitive atom のみを writable とし、derived atom は read-only に限定する。
  ],
  [
    - `AtomRef` の surface を signal に近い形で単純化できる
    - 実装とテストの初期コストを抑えられる
    - writable derived atom は将来の拡張余地として残せる
  ],
)

#adr(
  header("第2引数が関数なら derived atom として解釈する", Status.Accepted, "2026-03-10"),
  [
    `atom(key, initialValue)` と `atom(key, read)` の2形態を短く保ちたい一方で、関数値を primitive atom として許可すると API 判定が曖昧になる。
  ],
  [
    初期バージョンでは第 2 引数が関数であれば常に derived getter として扱い、function-valued primitive atom はサポートしない。
  ],
  [
    - callsite の見た目だけで primitive と derived を判別しやすい
    - overload 判定と実装を単純に保てる
    - 将来 function-valued primitive が必要になった場合は明示 API を別途追加できる
  ],
)
