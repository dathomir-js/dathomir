= SSR ユーティリティ（transformer）

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

SSR モードでの変換に必要なユーティリティ関数を提供する。
メインの SSR 変換ロジックは `transform` 内で処理されるが、
このモジュールは SSR 固有のコード生成ヘルパーを提供する。

== 提供する関数

=== isSSRImport

```typescript
function isSSRImport(name: string): name is SSRImport
```

指定されたインポート名が SSR 固有のものかを判定する。

=== generateSSRRender

```typescript
function generateSSRRender(
  tree: Expression,
  dynamicValues: Expression[],
  stateExpr: Expression | null
): Expression
```

構造化配列から `renderToString()` 呼び出し式を生成する。

=== generateStateObject

```typescript
function generateStateObject(
  signals: Map<string, Expression>
): Expression
```

Signal の状態をシリアライズするオブジェクト式を生成する。

== 定数

=== SSR_IMPORTS

SSR 固有のランタイムインポート名のリスト:
`renderToString`, `renderTree`, `serializeState`, `createMarker`, `MarkerType`

== 設計決定

=== ADR: ESTree プレーンオブジェクトの使用

プレーンな ESTree ノードオブジェクトを直接構築する方式を採用する（`transform` モジュールと統一）。

*理由:*
- このプロジェクトは oxc-parser + esrap を採用しているため、外部 AST ビルダーライブラリは不要
- プレーン ESTree オブジェクト（`{ type: "CallExpression", ... }` 等）は追加ライブラリなしで構築でき、`esrap` による出力とも直接互換性がある

*実装方針:*
- ローカルで ESTree ビルダーヘルパー（`nCall`, `nNew`, `nArr`, `nId`, `nLit`, `nObj`, `nProp`）を定義する
- 関数シグネチャの型は `ESTNode`（ローカル定義）を使用する

== テストケース

=== transform 統合テスト

- SSR モードで renderToString インポートを生成する
- SSR マーカーを挿入する
- Signal 状態のシリアライズコードを生成する
- SSR モードで Fragment (`<>...</>`) を renderToString に変換する

=== isSSRImport ユニットテスト

- SSR 固有インポート名（renderToString, renderTree, serializeState, createMarker, MarkerType）は true を返す
- 非 SSR インポート名（fromTree, setText, setAttr, event など）は false を返す
- 空文字列は false を返す

=== generateSSRRender ユニットテスト

- 動的値なしの場合、空の Map で renderToString を呼び出す
- 動的値ありの場合、インデックス付きエントリで Map を生成する
- stateExpr が null の場合、空オブジェクト {} を state として使用する
- stateExpr が指定された場合、その式を state として使用する
- 返される式は CallExpression で callee が "renderToString"

=== generateStateObject ユニットテスト

- signals が空の Map の場合、空のオブジェクト式を返す
- signals にエントリがある場合、各エントリを ObjectProperty として含む式を返す
