#import "../functions.typ": feature_spec
#import "../settings.typ": apply-settings
#show: apply-settings

= reactivity 機能詳細設計

#feature_spec(
  name: "createRoot",
  summary: [
    cleanup スコープを作成し、スコープ内で作成された effect/event を追跡する。
    dispose 関数を呼ぶと全ての追跡リソースが解放される。
  ],
  api: [
    ```typescript
    function createRoot(
      fn: (dispose: () => void) => void
    ): () => void
    ```

    *パラメータ*:
    - `fn`: スコープ内で実行されるコールバック。`dispose` 関数が引数として渡される

    *戻り値*: dispose 関数（スコープ内の全リソースを解放）
  ],
  edge_cases: [
    1. *ネスト*: `createRoot` 内で別の `createRoot` を呼ぶ
    2. *二重 dispose*: 同じ dispose を2回呼ぶ
    3. *dispose 後のアクセス*: dispose 後に effect が実行されない
    4. *例外発生*: fn 内で例外が発生した場合のリソース解放
    5. *同期 dispose*: fn 内で即座に dispose を呼ぶ
  ],
  test_cases: [
    *基本動作*:
    + createRoot 内の effect は追跡される
    + dispose() で全ての effect が停止する
    + dispose() で onCleanup が呼ばれる
    + dispose() 後は signal 更新しても effect が実行されない

    *ネスト*:
    + 親 dispose で子スコープも dispose される
    + 子 dispose は親に影響しない

    *templateEffect との統合*:
    + templateEffect は自動的に現在のスコープに登録
    + スコープ外で templateEffect を呼ぶと登録されない

    *onCleanup*:
    + 複数の onCleanup が登録順に呼ばれる
    + dispose 時に全ての onCleanup が実行される
    + onCleanup 内で例外が発生しても他の cleanup は実行される

    *エッジケース*:
    + 二重 dispose は2回目が無視される
    + スコープ外で onCleanup を呼んでも何も起きない
  ],
  impl_notes: [
    *Owner スタック*:
    - `currentOwner` グローバル変数でスタックを管理
    - `createRoot` 開始時にプッシュ、終了時にポップ
    - ネストした場合は内側の owner が優先

    *リソース追跡*:
    - `owner.effects: EffectCleanup[]` で effect を追跡
    - `owner.cleanups: (() => void)[]` で onCleanup を追跡

    *バンドルサイズ*:
    - 目標: ~200-300B
    - シンプルな配列ベースの実装
  ],
)

#feature_spec(
  name: "templateEffect",
  summary: [
    テンプレート更新用の effect。createRoot スコープに自動登録され、
    スコープの dispose 時に自動解除される。
  ],
  api: [
    ```typescript
    function templateEffect(fn: () => void): void
    ```

    *パラメータ*:
    - `fn`: リアクティブに再実行される関数

    *戻り値*: なし（cleanup は createRoot が管理）
  ],
  edge_cases: [
    1. *スコープ外*: createRoot 外で呼ぶとどうなるか
    2. *即時実行*: fn は同期的に初回実行される
    3. *無限ループ*: fn 内で自身の依存 signal を更新
    4. *batch との組み合わせ*: batch 内での動作
  ],
  test_cases: [
    *基本動作*:
    + 初回は同期的に実行される
    + 依存 signal が変更されると再実行される
    + createRoot.dispose() で停止する

    *依存追跡*:
    + signal.value を読むと依存が登録される
    + computed.value を読むと依存が登録される
    + peek() は依存を登録しない

    *batch との組み合わせ*:
    + batch 内で複数回 signal を更新しても effect は1回だけ実行
    + batch 終了時に flush される

    *スコープ外*:
    + createRoot 外で呼ぶと effect は登録されるが自動解除されない
    + 警告が出力される（開発モード）
  ],
  impl_notes: [
    *実装*:
    - 内部的に `effect()` を呼び、cleanup を `currentOwner.effects` に登録
    - `currentOwner` がない場合は登録せずに実行

    *effect との違い*:
    - `effect()` は cleanup 関数を返す
    - `templateEffect()` は何も返さない（cleanup は owner が管理）
  ],
)

#feature_spec(
  name: "signal",
  summary: [
    リアクティブな値を保持し、読み取りを追跡し、更新時に依存先へ通知する。
    TC39 Signals 仕様に準拠した `.value` アクセス。
  ],
  api: [
    ```typescript
    function signal<T>(initialValue: T): Signal<T>

    interface Signal<T> \{
      readonly value: T;     // 読み取り専用（書き込みは set()/update()）
      set(update: T | ((prev: T) => T)): void;  // 値を設定
      update(fn: (prev: T) => T): void;  // 更新関数で設定
      peek(): T;             // 追跡なしで読み取り
    \}
    ```
  ],
  edge_cases: [
    1. *undefined 初期値*: `signal<T>()` の動作
    2. *オブジェクト参照*: 同じ参照を設定した場合
    3. *NaN*: `NaN !== NaN` だが更新とみなすべきか
    4. *循環参照*: signal.value が signal 自身を含むオブジェクト
  ],
  test_cases: [
    *基本動作*:
    + 初期値が正しく設定される
    + .value で読み取りができる（readonly）
    + set() で値の設定ができる
    + update() で関数による更新ができる
    + .value への直接代入は TypeScript で禁止される

    *依存追跡*:
    + effect 内での .value 読み取りで依存登録
    + computed 内での .value 読み取りで依存登録
    + peek() では依存登録されない

    *通知*:
    + 値が変わったときのみ effect が再実行される
    + 同じ値を設定しても effect は再実行されない
    + NaN を設定した場合でも適切に処理される

    *batch*:
    + batch 内で複数回更新しても最終値のみが使われる
    + batch 終了時に1回だけ通知される
  ],
  impl_notes: [
    *等価比較*:
    - `Object.is()` を使用（NaN === NaN が true）
    - 参照比較なのでオブジェクトは常に更新

    *alien-signals 統合*:
    - 内部的に alien-signals の仕組みを使用
    - SignalNode で状態を管理
  ],
)

#feature_spec(
  name: "computed",
  summary: [
    依存 signal から派生値を計算し、キャッシュする。
    依存が変更されるまで再計算しない（遅延評価）。
  ],
  api: [
    ```typescript
    function computed<T>(
      getter: (previousValue?: T) => T
    ): Computed<T>

    interface Computed<T> \{
      readonly value: T;  // 読み取り専用
      peek(): T;          // 追跡なしで読み取り
    \}
    ```
  ],
  edge_cases: [
    1. *初回アクセス*: 最初に .value を読むまで計算されない
    2. *循環依存*: computed が別の computed に依存し、循環が発生
    3. *副作用*: getter 内で signal を更新する
    4. *例外*: getter が例外を投げた場合
  ],
  test_cases: [
    *遅延評価*:
    + .value を読むまで getter は呼ばれない
    + 依存が変更されても .value を読むまで再計算されない

    *キャッシュ*:
    + 依存が変わらなければ2回目の読み取りは再計算しない
    + getter は依存変更後の最初の読み取りで1回だけ呼ばれる

    *依存追跡*:
    + computed を読む effect は computed の依存となる
    + computed 内で読んだ signal は computed の依存となる

    *previousValue*:
    + 2回目以降の計算では前の値が渡される
    + 初回計算では undefined が渡される

    *例外*:
    + getter が例外を投げても状態が壊れない
    + 次回のアクセスで再度計算が試みられる
  ],
  impl_notes: [
    *ダーティフラグ*:
    - 依存変更時にダーティとしてマーク
    - 読み取り時にダーティなら再計算

    *メモリ管理*:
    - computed を監視する effect がなくなると依存リンクを解除
    - 次回読み取り時に依存を再構築
  ],
)
