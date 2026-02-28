= plugin（ビルドツール統合）

#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

Vite、webpack 等のビルドツール向けプラグインを提供する。
unplugin を使用して複数のバンドラーに対応し、JSX/TSX ファイルに対して
`\@dathomir/transformer` を適用する。

== 提供する関数

=== dathomir

```typescript
const dathomir: UnpluginInstance<PluginOptions | undefined>
```

unplugin インスタンス。複数のバンドラーに対応。デフォルトエクスポートでもある。

=== dathomirVitePlugin

```typescript
function dathomirVitePlugin(options?: PluginOptions): VitePlugin
```

Vite 専用プラグイン。Environment API でモード判定を行う。

=== dathomirWebpackPlugin

```typescript
const dathomirWebpackPlugin: (options?: PluginOptions) => WebpackPlugin
```

webpack 専用プラグイン。

=== dathomirRollupPlugin

```typescript
const dathomirRollupPlugin: (options?: PluginOptions) => RollupPlugin
```

Rollup 専用プラグイン。

=== dathomirEsbuildPlugin

```typescript
const dathomirEsbuildPlugin: (options?: PluginOptions) => EsbuildPlugin
```

esbuild 専用プラグイン。

== 設定

```typescript
interface PluginOptions {
  include?: string[];        // 対象ファイル拡張子（デフォルト: ['.tsx', '.jsx']）
  exclude?: string[];        // 除外パターン
  runtimeModule?: string;    // ランタイムモジュール名（デフォルト: '\@dathomir/core'）
  mode?: 'csr' | 'ssr';     // 強制モード指定
}
```

== 動作

=== ファイルフィルタリング

- `include` に一致し `exclude` に一致しないファイルのみ変換
- デフォルトで `.tsx` と `.jsx` ファイルを対象

=== モード判定

優先順位:
1. `options.mode`（明示的指定）
2. Vite Environment API（`environment.name`）
3. `options.ssr`（Vite SSR フラグ）
4. デフォルト: CSR

=== 変換

- `\@dathomir/transformer` の `transform()` を呼び出す
- ソースマップを生成する
- `filename` として変換対象ファイルの ID を渡す
- `runtimeModule` オプションを transformer に渡す

=== エラーハンドリング

- transform 失敗時は元のエラーメッセージにファイルパスを付与してスローする
- フォーマット: `[dathomir] Error transforming {filename}: {original message}`

== テストケース

=== 基本機能

- JSX/TSX ファイルを変換する
- 非対象ファイルを無視する
- 除外パターンに一致するファイルをスキップする
- カスタム include 拡張子を適用する

=== モード判定

- CSR/SSR モードを正しく判定する
- 強制モードが SSR フラグより優先される
- Environment API の edge モードを SSR として扱う

=== オプション

- `runtimeModule` オプションが transformer に正しく渡される
- `filename` が変換対象ファイルの ID として渡される

=== エラーハンドリング

- transform 失敗時にファイル名を含むエラーメッセージをスローする

=== エクスポート

- 全てのプラグインファクトリ（Vite/webpack/Rollup/esbuild）が正しくエクスポートされる
- デフォルトエクスポートとして `dathomir` が提供される
