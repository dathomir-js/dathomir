= SSR ユーティリティ（transformer）

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== インターフェース仕様

#interface_spec(
  name: "SSR transformer utilities",
  summary: [
    SSR モード変換で必要となる import 判定とコード生成ヘルパーを提供する。
  ],
  format: [
    *関数*:
    - `isSSRImport(name: string): name is SSRImport`
    - `generateSSRRender(tree: Expression, dynamicValues: Expression[], stateExpr: Expression | null): Expression`
    - `generateStateObject(signals: Map<string, Expression>): Expression`

    *定数*:
    - `SSR_IMPORTS`: `renderToString`, `renderTree`, `serializeState`, `createMarker`, `MarkerType`
  ],
  constraints: [
    - `isSSRImport` は SSR 固有ランタイム名のみを判定する
    - `generateSSRRender` は構造化配列から `renderToString()` 呼び出し式を生成する
    - `generateStateObject` は Signal 状態をシリアライズするオブジェクト式を生成する
  ],
)

== 設計判断

#adr(
  header: header("ESTree プレーンオブジェクトの使用", Status.Accepted, "2026-03-09"),
  context: [
    SSR ヘルパーでも `transform` 本体と同じ AST 生成方針を維持する必要がある。
  ],
  decision: [
    外部 AST ビルダーに依存せず、プレーンな ESTree ノードオブジェクトを直接構築する。
  ],
  rationale: [
    - このプロジェクトは oxc-parser + esrap を採用しているため、外部 AST ビルダーライブラリは不要
    - プレーン ESTree オブジェクトは追加依存なしで構築でき、`esrap` 出力と直接互換である
  ],
  consequences: [
    - ローカルの ESTree ビルダーヘルパーで必要なノードを組み立てる
    - 関数シグネチャの型はローカル定義の `ESTNode` 群で表現する
  ],
)

== 機能仕様

#feature_spec(
  name: "SSR helper coverage",
  summary: [
    SSR import 判定、`renderToString` 呼び出し生成、Signal 状態オブジェクト生成を検証する。
  ],
  test_cases: [
    *transform 統合テスト*:
    - SSR モードで renderToString インポートを生成する
    - SSR マーカーを挿入する
    - Signal 状態のシリアライズコードを生成する
    - SSR モードで Fragment (`<>...</>`) を renderToString に変換する

    *isSSRImport ユニットテスト*:
    - SSR 固有インポート名は true を返す
    - 非 SSR インポート名は false を返す
    - 空文字列は false を返す

    *generateSSRRender ユニットテスト*:
    - 動的値なしの場合、空の Map で renderToString を呼び出す
    - 動的値ありの場合、インデックス付きエントリで Map を生成する
    - stateExpr が null の場合、空オブジェクト {} を state として使用する
    - stateExpr が指定された場合、その式を state として使用する
    - 返される式は CallExpression で callee が `renderToString`

    *generateStateObject ユニットテスト*:
    - signals が空の Map の場合、空のオブジェクト式を返す
    - signals にエントリがある場合、各エントリを ObjectProperty として含む式を返す
  ],
)
