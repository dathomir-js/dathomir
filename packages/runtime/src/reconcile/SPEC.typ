= reconcile API

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

Keyed リストの効率的な差分更新を行う。既存ノードの再利用・移動・追加・削除を最小限の DOM 操作で実行する。

== 機能仕様

#feature_spec(
  name: "reconcile",
  summary: [
    親ノード配下の子要素リストを、新しいデータ配列に基づいて効率的に差分更新する。`keyFn` が定義されていればキー付きモードで DOM ノードを再利用・移動し、`undefined` の場合はインデックスベースの非キー付きモードで動作する。
  ],
  api: [
    ```typescript
    function reconcile<T>(
      parent: Node,
      items: T[],
      keyFn: ((item: T) => unknown) | undefined,
      createFn: (item: T, index: number) => Node,
      updateFn?: (node: Node, item: T, index: number) => void
    ): void
    ```

    - `parent`: 子要素を管理する親ノード
    - `items`: 新しいリストデータ
    - `keyFn`: 各アイテムから一意キーを抽出する関数（`undefined` の場合は非キー付きモード）
    - `createFn`: 新しいアイテムから DOM ノードを生成する関数（index も受け取る）
    - `updateFn`: 既存ノードを更新する関数（オプショナル）

    *内部型*:
    ```typescript
    type ManagedItem<T> = { key: unknown; node: Node; item: T }
    ```

    *キー付きモード*（`keyFn` が定義されている場合）:
    1. `WeakMap` で親ノードごとの管理リスト（`ManagedItem<T>[]`）を保持
    2. 新しいリストと既存リストをキーで比較
    3. 既存ノードの再利用（キーが一致する場合）— `updateFn` が指定されていれば、ノードを更新
    4. 新しいノードの追加（キーが新規の場合）
    5. 不要なノードの削除（キーが消えた場合）
    6. ノードの順序変更（キーの位置が変わった場合）

    *非キー付きモード*（`keyFn` が `undefined` の場合）:
    1. インデックスベースでノードを再利用
    2. 既存ノード数 < 新規リスト長: 不足分を作成
    3. 既存ノード数 > 新規リスト長: 余剰分を削除
    4. `updateFn` が指定されていれば、再利用ノードを更新
  ],
  edge_cases: [
    - 重複キーで dev モード警告
    - `null` キーで dev モード警告
    - `undefined` キーで dev モード警告
  ],
  test_cases: [
    *Basic*:
    - 空配列から 3 アイテムを生成
    - 3 アイテムを空配列にして全削除
    - アイテムが同一の場合 DOM を変更しない

    *Addition*:
    - 末尾にアイテム追加 \[1,2,3\]->\[1,2,3,4\]
    - 先頭にアイテム追加 \[1,2,3\]->\[0,1,2,3\]
    - 中間にアイテム追加 \[1,2,3\]->\[1,1.5,2,3\]

    *Deletion*:
    - 末尾からアイテム削除 \[1,2,3\]->\[1,2\]
    - 先頭からアイテム削除 \[1,2,3\]->\[2,3\]
    - 中間からアイテム削除 \[1,2,3\]->\[1,3\]

    *Keyed*:
    - 順序反転で DOM ノード再利用 \[a,b,c\]->\[c,b,a\]
    - 中間アイテム削除で DOM ノード再利用 \[a,b,c\]->\[a,c\]
    - 中間挿入で既存ノードを保持 \[a,b\]->\[a,x,b\]

    *Unkeyed*:
    - 順序反転で全ノード更新 \[1,2,3\]->\[3,2,1\]
    - 既存ノードの再利用と更新 \[a,b,c\]->\[x,y,z\]

    *Edge cases*:
    - 既存ノードのみ updateFn を呼ぶ
    - 新規ノードのみ createFn を呼ぶ
    - 重複キーで dev モード警告
    - createFn に正しい index を渡す
    - updateFn に正しい index を渡す

    *Unkeyed shrink/grow*:
    - 縮小時に余分なノードを削除 \[a,b,c\]->\[x\]
    - 拡大時に新しいノードを生成 \[a\]->\[x,y,z\]

    *Key warning*:
    - dev モードで null キー警告
    - dev モードで undefined キー警告

    *Legacy*:
    - 初期アイテムの生成
    - 新しいアイテムの追加
    - アイテムの削除
    - アイテムの並べ替え
    - 空から全アイテムへ
    - 全アイテムから空へ
    - 既存ノードの再利用
  ],
  impl_notes: [
    - `WeakMap` で管理リストを保持し、GC によるメモリ解放を保証
    - バンドルサイズ目標 \~400B のため、最適なアルゴリズムより簡潔さを優先
  ],
)

== 設計判断

#adr(
  header("キー付きと非キー付きの両対応", Status.Accepted, "2026-02-11"),
  [
    Keyed のみサポートする案もあったが、シンプルな用途では keyed が冗長。
  ],
  [
    `keyFn` が `undefined` の場合は非キー付きモードで動作する。
    - キー付きモード: WeakMap で管理、効率的な移動・再利用
    - 非キー付きモード: インデックスベースで単純に更新
  ],
  [
    1 つの API でシンプルなリストとパフォーマンス重視のリスト両方に対応できる。
  ],
)

#adr(
  header("updateFn の追加", Status.Accepted, "2026-02-11"),
  [
    ノードを再利用する際、内容を更新したいケースが多い。
  ],
  [
    オプショナルな `updateFn` を追加。
    - 既存ノード再利用時に呼ばれる
    - キー付き・非キー付き両方で動作
  ],
  [
    ノード再利用時のデータ同期が可能になり、不要な DOM 再生成を防げる。
  ],
)

#adr(
  header("createFn に index 引数を追加", Status.Accepted, "2026-02-11"),
  [
    インデックスを使った UI 表示（例: "Item 1", "Item 2"）が必要。
  ],
  [
    `createFn(item, index)` として index を渡す。
  ],
  [
    呼び出し側でインデックスを別途管理する必要がなくなる。
  ],
)

#adr(
  header("重複キーと null/undefined キーの警告", Status.Accepted, "2026-02-11"),
  [
    重複キーや null キーはバグの原因になりやすい。
  ],
  [
    DEV モードで警告を出力する。
  ],
  [
    開発時に早期発見できる。プロダクションビルドではバンドルサイズへの影響なし。
  ],
)
