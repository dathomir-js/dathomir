= transform 関数

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== インターフェース仕様

#interface_spec(
  name: "transform API",
  summary: [
    JSX を含む JavaScript コードを解析し、CSR では `fromTree()` ベース、SSR では `renderToString()` ベースのコードへ変換する。`oxc-parser` で ESTree 互換 AST を生成し、`zimmerframe` で走査・変換、`esrap` で再生成する。
  ],
  format: [
    ```typescript
    function transform(code: string, options?: TransformOptions): TransformResult
    ```
  ],
  constraints: [
    - 純粋な ESTree ノードのみを使用して変換する
    - コンポーネント要素は tree ノードへ含めず、関数呼び出し式として出力する
    - HTML 要素は構造化配列 tree と dynamic part 群へ分解する
    - `options.mode` に応じて CSR / SSR の生成結果を切り替える
    - 必要なランタイムインポートを自動的に追加する
    - `client:*` directive はコンポーネント要素でのみ許可し、HTML 要素では transform error にする
    - `client:*` directive は 1 要素につき 1 つまでとし、内部 metadata は予約属性 `data-dh-island` / `data-dh-island-value` に正規化する
  ],
)

== 振る舞い仕様

#behavior_spec(
  name: "コンポーネント要素と HTML 要素の判別",
  summary: [
    JSX 要素のタグ名が大文字で始まる場合、または `JSXMemberExpression` の場合はコンポーネントとして扱い、それ以外は HTML 要素として扱う。
  ],
  steps: [
    1. `<Counter />` は `Counter({ ...props })` のような関数呼び出しへ変換する。
    2. `<div />` は構造化配列表現へ変換する。
    3. `<Foo.Bar />` はコンポーネント参照として扱う。
    4. ルート要素がコンポーネントの場合は tree を生成せず、直接関数呼び出しを返す。
  ],
  postconditions: [
    - コンポーネント要素は `fromTree()` / `renderToString()` のツリーノードに含まれない
    - 属性は props オブジェクトとして関数呼び出しへ渡される
  ],
)

#behavior_spec(
  name: "CSR モード変換",
  summary: [
    CSR モードでは JSX を `fromTree()` と DOM 更新ランタイム呼び出しへ変換する。
  ],
  steps: [
    1. JSX 式を `fromTree()` 呼び出しに変換する。
    2. リテラル属性は構造化配列に含める。
    3. reactive access を含む属性は `templateEffect` でラップする。
    4. reactive access を含まない式属性は lexical scope を壊さないよう `setAttr()` で一度だけ初期化する。
    4. イベントハンドラは `event()` に変換する。
    5. テキスト式は `setText()` へ変換する。
    6. コンポーネント要素は `insert()` で挿入し、`templateEffect` ではラップしない。
    7. 条件式、`.map()`、logical expression、JSX を含む一般式、`JSXSpreadChild` は `templateEffect` 経由の `insert()` として扱う。
  ],
  postconditions: [
    - `@dathomir/runtime` から必要な import が自動生成される
    - DOM ナビゲーションと動的更新コードが生成される
  ],
)

#behavior_spec(
  name: "SSR モード変換",
  summary: [
    SSR モードでは JSX を `renderToString()` を用いた HTML 文字列生成コードへ変換する。
  ],
  steps: [
    1. HTML 要素を tree と動的値 Map へ分解する。
    2. `renderToString()` 呼び出しを生成する。
    3. SSR マーカーを挿入する。
     4. Signal の初期値シリアライズコードを生成する。
     5. コンポーネント要素は関数呼び出しに変換し、動的値として渡す。
     6. 式コンテナ内のローカル static expression は、ランタイム補助変数へ退避せず元の式のまま出力する。
   ],
  postconditions: [
    - SSR 出力は DOM 依存コードを含まない
    - 条件式や `.map()` 内のネスト JSX も SSR 方式で変換される
  ],
)

#behavior_spec(
  name: "変換パイプライン",
  summary: [
    `transform` はパース、AST 走査、tree 生成、dynamic part 展開、ランタイム import 注入、コード再生成の順に処理する。
  ],
  steps: [
    1. `oxc-parser` でソースコードを ESTree 互換 AST に変換する。
    2. `zimmerframe` で AST を走査し、根 JSX 要素のみを変換する。
    3. HTML 要素を構造化配列表現へ変換する。
    4. DOM ナビゲーションまたは SSR dynamic Map を生成する。
    5. 必要なランタイム import を追加する。
    6. `esrap` でコードを再生成する。
  ],
  postconditions: [
    - 走査不要なサブツリーは `next()` を呼ばず自然にスキップされる
    - ノード置換は visitor の戻り値として新ノードを返す immutable 変換で行う
  ],
)

#behavior_spec(
  name: "islands directive handling",
  summary: [
    `client:*` directive を component call 用の内部 metadata へ正規化し、後続 runtime が strategy を読めるようにする。
  ],
  steps: [
    1. `client:load`, `client:visible`, `client:idle`, `client:interaction`, `client:media` を islands directive として認識する。
    2. `client:*` namespace の未知 directive 名は例外を投げる。
    3. directive はコンポーネント要素でのみ許可し、HTML 要素上では例外を投げる。
    4. 1 つのコンポーネント要素に複数 directive がある場合は例外を投げる。
    5. `client:load`, `client:visible`, `client:idle` は bare 指定のみ許可し、値付き指定は例外を投げる。
    6. directive 自体は user props に残さず、`data-dh-island` と必要なら `data-dh-island-value` へ変換して component props に付与する。
    7. `client:interaction` は bare 指定時に `click` を補完し、値を与える場合は string literal event type のみ許可する。`client:media` は string literal media query を必須とする。
  ],
  postconditions: [
    - transform 後の出力から `client:*` 属性は消える
    - CSR / SSR の両モードで同じ metadata key を使う
  ],
)

== 設計判断

#adr(
  header("oxc-parser + zimmerframe の採用", Status.Accepted, "2026-03-09"),
  [
    高速で軽量な JSX トランスフォームパイプラインを、不要な AST 変換アダプタなしで構成する必要がある。
  ],
  [
    `oxc-parser` + `zimmerframe` + 素の ESTree ノードオブジェクト組み立てを使用する。
  ],
  [
    - `oxc-parser` は純粋な ESTree 互換 AST を高速に出力できる
    - 外部 AST ビルダー依存を増やさずに済む
    - `zimmerframe` は visitor パターンで根 JSX 要素のみの変換に適している
  ],
)

#adr(
  header("コンポーネント判別基準", Status.Accepted, "2026-03-09"),
  [
    transform はランタイム情報なしで HTML 要素とコンポーネントを静的に判別する必要がある。
  ],
  [
    タグ名の先頭文字が大文字の場合、または `JSXMemberExpression` の場合をコンポーネントとして扱う。
  ],
  [
    - JSX の標準慣例に従う
    - コンパイル時に判別可能である
  ],
)

#adr(
  header("コンポーネントの props 渡し方", Status.Accepted, "2026-03-09"),
  [
    コンポーネント要素の JSX 属性をどう実行時に渡すかを一貫化する必要がある。
  ],
  [
    JSX 属性をそのまま props オブジェクトとして渡し、`computed()` ラッピングは行わない。
  ],
  [
    - 関数コンポーネントは一度だけ実行される想定と整合する
    - props は初期値として使われ、必要ならコンポーネント内部で signal 化される
  ],
)

#adr(
  header("コンポーネント insert を templateEffect でラップしない", Status.Accepted, "2026-03-09"),
  [
    コンポーネント要素を動的挿入対象として扱うが、props 変化のたびに再生成してはならない。
  ],
  [
    コンポーネントを `insert()` で挿入する際は `templateEffect` でラップしない。
  ],
  [
    - コンポーネント内部状態のリセットを防ぐ
    - 条件式や `.map()` のような式全体再評価ケースだけが `templateEffect` の対象になる
  ],
)

#adr(
  header("静的式属性（reactive access なし）の扱い", Status.Accepted, "2026-03-09"),
  [
    式属性のうち reactive access を含まないものまで effect 化すると不要なオーバーヘッドになる。
  ],
  [
    `.value` アクセスを含まない式属性は `templateEffect` でラップせず、静的属性オブジェクトに含める。
  ],
  [
    - 非 reactive な式は一度だけ評価すれば十分である
    - 不要な effect 生成を防げる
  ],
)

#adr(
  header("ハイフン付き属性名の扱い", Status.Accepted, "2026-03-09"),
  [
    `data-foo` や `aria-label` のような属性名は JavaScript 識別子として不正である。
  ],
  [
    有効な識別子でない属性名は文字列リテラルキーの ObjectProperty として出力する。
  ],
  [
    - 構文エラーのある JS 出力を避けられる
    - ハイフン付き属性を安全に保持できる
  ],
)

#adr(
  header("型安全性 — `as` アサーションの除去", Status.Accepted, "2026-03-09"),
  [
    transformer 内の `as` キャストは型安全性を弱め、visitor 内の絞り込みを阻害する。
  ],
  [
    `as unknown as X` は禁止し、TypeScript の型推論・型ガードで対応する。必要時のみ直接 `as X` を許可する。
  ],
  [
    - JSX ノード型を `ESTNode` に揃えることで visitor と型整合が取れる
    - 型ガードの恩恵で後続コードの安全性が上がる
  ],
)

#adr(
  header("Fragment の dynamicParts の正しい収集", Status.Accepted, "2026-03-09"),
  [
    Fragment 変換で `processChildren` が push した dynamic parts を取りこぼす不整合が起こりうる。
  ],
  [
    Fragment パスでは `dynamicParts` ローカル変数をそのまま戻り値に含め、`children.flatMap((c) => c.dynamicParts)` は使わない。
  ],
  [
    - Fragment 内の動的テキストやコンポーネント insert の消失を防ぐ
    - 非 Fragment パスと同じ一貫した収集モデルになる
  ],
)

#adr(
  header("logical expression を insert として扱う", Status.Accepted, "2026-03-09"),
  [
    `{cond && <A/>}` や `{a || <B/>}` は頻出だが、text dynamic part では安全に扱えない。
  ],
  [
    `JSXExpressionContainer` 内の `LogicalExpression` は `{insert}` dynamic part として扱う。
  ],
  [
    - CSR では `templateEffect + insert()`、SSR では `renderToString()` 用の動的値へ変換される
    - JSX を含む条件レンダリングを一貫して処理できる
  ],
)

#adr(
  header("式内 JSX の汎用フォールバック", Status.Accepted, "2026-03-09"),
  [
    ArrayExpression / ObjectExpression / SequenceExpression などに JSX が埋め込まれる場合、既存の特殊分岐だけでは取りこぼす。
  ],
  [
    式サブツリーに `JSXElement` または `JSXFragment` が含まれる場合は `transformNestedJSX` を適用して `insert` dynamic part として扱う。
  ],
  [
    - JSX を含む式を text 更新ではなくノード挿入の責務へ寄せられる
    - 条件分岐以外の式構造でも一貫した変換ができる
  ],
)

#adr(
  header("namespaced 属性名を文字列キーとして保持", Status.Accepted, "2026-03-09"),
  [
    `xlink:href` のような namespaced 属性は `:` を含み JavaScript 識別子にできない。
  ],
  [
    `JSXNamespacedName` 属性は `"namespace:name"` 形式の文字列キーとして出力する。
  ],
  [
    - SVG 属性を落とさず安全に保持できる
    - 不正な識別子生成を避けられる
  ],
)

#adr(
  header("JSXSpreadChild の変換", Status.Accepted, "2026-03-09"),
  [
    `JSXSpreadChild` を無視すると子要素が静かに欠落する。
  ],
  [
    `JSXSpreadChild` は `insert` dynamic part として扱い、式は `transformNestedJSX` で mode-aware に先行変換する。
  ],
  [
    - 既存の動的挿入フローへ統合できる
    - spread child を含む JSX を欠落させず変換できる
  ],
)

#adr(
  header("SSR モードにおける `transformNestedJSX` の mode 伝播", Status.Accepted, "2026-03-09"),
  [
    `transformNestedJSX` が `state.mode` を無視すると、SSR モードでも条件分岐内 JSX が CSR の `fromTree` へ誤変換される。
  ],
  [
    `transformNestedJSX` 内の visitor は `state.mode` に応じて、SSR では `transformJSXForSSRNode`、CSR では `transformJSXNode` を呼ぶ。
  ],
  [
    - SSR モードの条件式や `.map()` 内 JSX が `renderToString()` に変換される
    - CSR の既存動作は維持される
  ],
)

== 機能仕様

#feature_spec(
  name: "transform coverage",
  summary: [
    単純な JSX、動的属性、イベント、Fragment、コンポーネント、SSR 分岐、ネスト JSX、ランタイム import 注入まで含めて変換結果を検証する。
  ],
  edge_cases: [
    - 空の JSX 要素
    - 動的コンテンツを含む Fragment
    - スプレッド属性
    - 条件付きレンダリング
    - リストレンダリング
    - コンポーネントの children 伝達
    - ハイフン付き属性名
    - 静的式属性
    - logical expression
    - 式内 JSX の汎用フォールバック
    - `JSXSpreadChild`
    - namespaced 属性
  ],
  test_cases: [
    - 単純な JSX 要素を変換する
    - 属性付き要素を変換する
    - 動的テキストを変換する
    - イベントハンドラを変換する
    - ネストされた要素を変換する
    - SSR モードで `renderToString` を使用する
    - コンポーネント要素を関数呼び出しに変換する（CSR）
    - コンポーネント要素を関数呼び出しに変換する（SSR）
    - ネストされたコンポーネント要素を insert として扱う
    - スプレッド属性（HTML 要素）を `spread()` + `templateEffect` に変換する
    - 条件付きレンダリング（ternary 式）を `insert()` + `templateEffect` に変換する
    - リストレンダリング（`.map()` 式）を `insert()` + `templateEffect` に変換する
    - 既存 import 文がある場合、ランタイムインポートをその直後に挿入する
    - ネストされた Fragment（CSR）を処理する
    - Fragment 内の動的テキストで `templateEffect` + `setText` が正しく生成される
    - Fragment 内のコンポーネントで `insert()` が正しく生成される
    - ハイフン付き属性名で文字列リテラルキーの ObjectProperty を生成する
    - 静的式属性では `templateEffect` なしで `setAttr()` により初期化する
    - 関数スコープ内ローカル識別子を属性に渡しても hoist によるスコープ破壊が起きない
    - SSR モードの条件付きレンダリングで各 JSX 分岐が `renderToString()` に変換される
    - SSR モードの logical expression で JSX 分岐が `renderToString()` に変換される
    - `client:visible` 付き component を `data-dh-island="visible"` metadata 付き function call へ変換する
    - `client:interaction="mouseenter"` を `data-dh-island-value` 付き metadata へ変換する
    - bare `client:interaction` を `data-dh-island-value="click"` へ変換する
     - `client:media` に string literal がない場合を transform error にする
     - `client:visible="foo"` のような値付き valueless directive を transform error にする
     - HTML 要素上の `client:*` directive を transform error にする
     - 複数の `client:*` directive 組み合わせを transform error にする
     - 未知の `client:*` directive 名を transform error にする
     - islands directive と `data-dh-island*` 明示 props の衝突を transform error にする
   ],
 )
