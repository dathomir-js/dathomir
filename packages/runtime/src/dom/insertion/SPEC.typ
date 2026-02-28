= insertion API

#import "/SPEC/settings.typ": *
#import "/SPEC/functions.typ": *
#show: apply-settings

== 目的

DOM ノードの挿入と追加を行うユーティリティ関数を提供する。

== 関数

=== `append`

```typescript
function append(parent: Node, child: Node): void
```

親ノードの末尾に子ノードを追加する。`parent.appendChild(child)` のラッパー。

=== `insert`

```typescript
function insert(
  parent: Node,
  child: Node | (() => DocumentFragment) | unknown,
  anchor: Node | null
): void
```

アンカーノードの前に子ノードを挿入する。`anchor` が `null` の場合は末尾に追加する。

`child` の型:
- `Node`: 単一のノード
- `() => DocumentFragment`: DocumentFragment を返すファクトリー関数
- `unknown`: その他の値（文字列化してテキストノードに変換）

== 動的挿入の動作仕様

`insert` 関数はアンカータイプ（SSR/CSR）を判別して、適切なクリーンアップを行ってから新しいコンテンツを挿入する。

=== アンカータイプの判別

アンカーノードのコメント値の先頭で判別する。

- *SSR アンカー*: コメント値が `dh:` で始まる（例: `<!--dh:i:0-->`）
  - ハイドレーション層が生成するマーカー
- *CSR アンカー*: コメント値が `{insert}` など（`fromTree` が生成）
  - テンプレートノードの一部であり、隣接ノードは他のテンプレートノード

=== 初回呼び出し（SSR アンカーの場合）

SSR で生成された既存コンテンツを削除してから新しいコンテンツを挿入する。

1. アンカーが `dh:` プレフィックスのコメントノードかを確認
2. `anchor.nextSibling` から次の `<!--dh:...-->` マーカーまでのノードを収集して削除
3. 新しいコンテンツを `anchor` の前に挿入
4. 挿入したノードを `WeakMap` で追跡

=== 初回呼び出し（CSR アンカーの場合）

クリーンアップは不要。隣接ノードはテンプレートの他の要素であり、削除してはいけない。

1. クリーンアップをスキップ
2. 新しいコンテンツを `anchor` の前に挿入
3. 挿入したノードを `WeakMap` で追跡

=== 2回目以降の呼び出し（リアクティブ更新）

前回挿入したコンテンツを削除してから新しいコンテンツを挿入する（SSR/CSR 共通）。

1. `WeakMap` から前回挿入したノードリストを取得
2. すべてのノードを DOM から削除
3. 新しいコンテンツを `anchor` の前に挿入
4. 挿入したノードを `WeakMap` で追跡（上書き）

== 設計判断

#adr(
  header("WeakMap による挿入追跡", Status.Accepted, "2026-02-11"),
  [
    `templateEffect` 内で `insert` が再実行されるとき、前回挿入した DOM を削除する必要がある。
  ],
  [
    `WeakMap<Node, Node[]>` で `anchor` ごとに挿入済みノードを追跡。
    - `anchor` が削除されれば WeakMap から自動で消える（メモリリーク防止）
    - 初回呼び出しは `WeakMap` にエントリなし → アンカータイプに応じた初期化処理へ
    - 2回目以降は追跡されたノードを削除してから更新
  ],
  [
    `anchor` を WeakMap のキーとして利用することで、アンカーが DOM から削除された時点でエントリが自動的に解放される。
  ],
)

#adr(
  header("アンカータイプによる SSR クリーンアップの判別", Status.Accepted, "2026-02-11"),
  [
    `insert` は SSR ハイドレーション時にもリアクティブな CSR テンプレート更新時にも呼ばれる。当初は「初回呼び出し = SSR クリーンアップが必要」と仮定していたが、CSR テンプレートの `fromTree` が生成するアンカー（`<!--{insert}-->`）に対しても同じ処理が走り、隣接するテンプレートノードが誤って削除されるバグが発生した。
  ],
  [
    アンカーの comment 値が `dh:` で始まるかどうかでアンカータイプを判別する。
    - SSR アンカー（`dh:` プレフィックス）: マーカー後のサーバーレンダリングコンテンツを削除
    - CSR アンカー（その他）: クリーンアップをスキップ（隣接ノードはテンプレートの一部）
  ],
  [
    SSR/CSR 両方のコンテキストで `insert` を安全に呼べるようになる。`hydrateRoot` が正式に実装されれば、この判別ロジックは削除できる。
  ],
  alternatives: [
    `insert` から SSR クリーンアップ責務を完全に除去し、ハイドレーション層に委譲する。`hydrateRoot` 等が正式に実装されれば、この判別ロジックも削除できる。
  ],
)

#adr(
  header("複数の child 型のサポート", Status.Accepted, "2026-02-11"),
  [
    ファクトリー関数や予期しない値を渡されるケースに対応したい。
  ],
  [
    - `DocumentFragment`: そのまま挿入（children を追跡）
    - `Node`: 単一ノード挿入
    - `() => DocumentFragment`: 呼び出してから挿入
    - その他: `String(value)` でテキストノードに変換（DEV モードで警告）
  ],
  [
    様々な child 型を透過的に扱えるため、コンパイラの生成コードと手書きコードの両方で `insert` を使いやすい。
  ],
)

- SSR クリーンアップはハイドレーション層（`hydrateRoot`）が本来の担当であり、`insert` 内のクリーンアップは暫定的な実装である
- ハイドレーションが正式に実装された場合、`insert` から SSR クリーンアップロジックを除去することが望ましい
