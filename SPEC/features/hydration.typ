#import "../functions.typ": feature_spec
#import "../settings.typ": apply-settings
#show: apply-settings

= hydration 機能詳細設計

#feature_spec(
  name: "hydrate",
  summary: [
    SSR で生成された DOM を再利用し、リアクティビティとイベントを接続する。
    TreeWalker でマーカーを線形探索し、各マーカーに対応する処理を実行する。
  ],
  api: [
    ```typescript
    function hydrate(
      root: Element | ShadowRoot,
      setup: (context: HydrationContext) => void
    ): void

    interface HydrationContext \{
      // テキストマーカーを取得
      text(id: number): Text;
      // 挿入ポイントマーカーを取得
      insertPoint(id: number): Comment;
      // ブロック境界を取得
      block(id: number): \{ start: Comment; end: Comment \};
      // 状態をデシリアライズ
      state<T>(key: string): T | undefined;
    \}
    ```

    *パラメータ*:
    - `root`: Hydration 対象のルート要素（通常は ShadowRoot）
    - `setup`: マーカーを使ってリアクティビティを設定するコールバック

    *戻り値*: なし
  ],
  edge_cases: [
    1. *二重 Hydration*: 同じ root に対して2回呼ばれた場合（スキップ）
    2. *マーカー欠損*: 期待するマーカーが見つからない場合
    3. *マーカー順序不整合*: SSR と CSR の出力順序が異なる場合
    4. *closed ShadowRoot*: アクセスできない ShadowRoot
    5. *ネストした Web Components*: 親の Hydration 中に子の Hydration が発生
    6. *空の状態*: シリアライズされた状態がない場合
  ],
  test_cases: [
    *基本動作*:
    + テキストマーカー (`\<!--dh:t:1-->`) から Text ノードを取得
    + 挿入ポイントマーカー (`\<!--dh:i:1-->`) から Comment ノードを取得
    + ブロックマーカー (`\<!--dh:b:1-->...\<!--/dh:b-->`) から境界を取得
    + 状態スクリプト (`<script data-dh-state>`) からデシリアライズ

    *冪等性*:
    + 同じ root に2回 hydrate() を呼んでも1回だけ実行
    + WeakMap で Hydration 済みを追跡

    *エラーハンドリング*:
    + 開発モード: マーカー欠損時に例外
    + 本番モード: マーカー欠損時に警告 + CSR フォールバック
    + closed ShadowRoot: 警告を出力してスキップ

    *ミスマッチ検出*:
    + テキスト内容のミスマッチを検出
    + 要素タイプのミスマッチを検出
    + 属性値のミスマッチを検出

    *ネスト*:
    + 親コンポーネント内の子コンポーネントが正しく Hydration される
    + 各 ShadowRoot は独立して Hydration される
  ],
  impl_notes: [
    *マーカー形式*:
    - テキスト: `\<!--dh:t:ID-->` の直後の Text ノード
    - 挿入ポイント: `\<!--dh:i:ID-->` Comment 自体
    - ブロック開始: `\<!--dh:b:ID-->` Comment
    - ブロック終了: `\<!--/dh:b-->` Comment

    *探索戦略*:
    - TreeWalker で SHOW_COMMENT | SHOW_TEXT を線形探索
    - マーカーを Map\<ID, Node> にキャッシュ
    - 探索範囲は root 内のみ（ShadowRoot 単位）

    *状態転送*:
    - `<script type="application/json" data-dh-state>` から読み取り
    - devalue でデシリアライズ
    - 読み取り後にスクリプト要素を削除

    *参考実装*:
    - Svelte: `hydrate()` in `svelte/internal`
    - SolidJS: `hydrate()` in `solid-js/web`
  ],
)

#feature_spec(
  name: "renderToString",
  summary: [
    構造化配列（IR）から SSR 用の HTML 文字列を生成する。
    Hydration 用のマーカーを適切な位置に挿入する。
  ],
  api: [
    ```typescript
    function renderToString(
      tree: Tree,
      context: SSRContext
    ): string

    interface SSRContext \{
      // マーカー ID を生成
      nextId(): number;
      // 状態を登録
      registerState(key: string, value: unknown): void;
    \}
    ```
  ],
  edge_cases: [
    1. *XSS 防止*: ユーザー入力を含むテキストのエスケープ
    2. *void 要素*: `<input>`, `<br>` など閉じタグなし
    3. *boolean 属性*: `disabled`, `checked` など
    4. *null/undefined 属性*: 出力しない
    5. *空文字列属性*: `class=""` として出力
  ],
  test_cases: [
    *基本出力*:
    + 単純な要素: `<div>Hello</div>`
    + ネスト: `<div><span>text</span></div>`
    + 属性: `<div class="foo" id="bar">`

    *マーカー*:
    + 動的テキストの前に `\<!--dh:t:ID-->` を挿入
    + 挿入ポイントに `\<!--dh:i:ID-->` を挿入
    + 条件ブロックに `\<!--dh:b:ID-->...\<!--/dh:b-->` を挿入

    *エスケープ*:
    + `<script>` タグを含むテキストがエスケープされる
    + `&`, `<`, `>`, `"`, `'` がエスケープされる
    + 属性値内の `"` がエスケープされる

    *状態シリアライズ*:
    + 状態が `<script data-dh-state>` として出力される
    + devalue でシリアライズされる
  ],
  impl_notes: [
    *パフォーマンス*:
    - 文字列連結ではなく配列に push して最後に join
    - テンプレートリテラルを活用

    *Web 標準のみ使用*:
    - Node.js 依存ゼロ（Edge Runtime 対応）
    - `TextEncoder` は使用可能
  ],
)
