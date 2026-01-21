---
applyTo: '**'
priority: 10
---

# Dathomir Roadmap - Architecture Rewrite (2025-2026)

## 目的

VNode ベースアーキテクチャから **SolidJS スタイルの Fine-grained Reactivity + Direct DOM** への全面移行。
TC39 Signals (alien-signals) を活用し、Compiler-First アプローチでどこよりも高速・軽量・独自性のあるフレームワークを構築する。

**破壊的変更度**: 100% (完全な書き直し)
**期待パフォーマンス向上**: 3-5x
**目標バンドルサイズ**: <2KB (現在 3.08KB)

---

## 🏗️ Architecture Decision (2025-12-01)

**採用するアプローチ**: SolidJS ベースの Fine-grained Reactivity
- VNode システムを完全削除
- JSX → Direct DOM compilation
- Template cloning + createElement のハイブリッド戦略
- Compiler-assisted SSR state serialization

**独自性**:
1. TC39 Signals API (`.value` アクセス)
2. alien-signals (50% 高速)
3. 自動 Signal シリアライズ (SSR→CSR)
4. Web Components first-class support
5. Edge runtime 最適化
6. より明示的なコンパイル出力

---

## ✅ 決めるべきこと（設計の契約）

### 最初に合意する順番（推奨）
- [ ] 1) SSR → Hydration: マーカー方式/粒度/探索戦略（全設計の前提）
- [ ] 2) SSR → Hydration: ミスマッチ方針/診断情報（運用とDXの前提）
- [ ] 3) Runtime ↔ Transformer: 出力形（IR）とruntime原語（実装量の上限を決める）
- [ ] 4) イベントシステム: 直付け/委譲とcleanup契約（APIとSSR互換に直結）
- [ ] 5) 状態転送（SSR → CSR）: 何を/どこまで転送するか（必要最小を決める）

### SSR → Hydration（最重要）
- [x] マーカー方式: 混在（境界はコメント、要素は `data-*`）（将来互換のバージョン含む）
- [x] マーカー粒度: 基本は「コメント境界（text/insert/block）＋順序」で復元する（要素 `data-*` は必要時のみ）
- [ ] 探索戦略: TreeWalker で線形探索 / key で直接参照 / 境界スコープ化
- [x] Shadow DOM 探索範囲: ShadowRoot は open のみ対象
- [x] Hydration 責務: Web Component が自分の ShadowRoot を担当（外部FWでも単体利用できることを優先）
- [ ] Hydration の冪等性: 二重初期化を検出して安全にスキップできる
- [ ] ミスマッチ方針: 例外 / 警告 + CSR フォールバック / 部分リカバリ
- [ ] 初期化順序: イベント復元 → effect 接続 or effect → イベント

### 状態転送（SSR → CSR）
- [ ] 転送範囲: なし（再実行のみ）/ 初期値のみ / Signal ID + 初期値 / スナップショット
- [ ] 注入形式: `window.__DATHOMIR_STATE__` / `type="application/json"` / 分割
- [ ] エスケープ規約: XSS 対策（文字列化・復元のルール）
- [ ] 信頼境界: サーバ生成データの取り扱い（改ざん耐性の要否）

### Runtime ↔ Transformer（実装量に直結）
- [ ] transformer 出力形: DOM 生成コード / テンプレ + 操作テーブル（IR）/ ハイブリッド
- [ ] IR の安定性: 内部専用（破壊変更 OK）/ セマンティックバージョンで管理
- [ ] runtime の原語: `template` / `insert` / `setAttr` / `setProp` / `addEvent` などの最小セット

### イベントシステム
- [ ] 方針: 直付け / 委譲（常時）/ 委譲（オプトイン）
- [ ] ハンドラ表現: 関数参照 / ID 参照（SSR 互換を優先）
- [ ] cleanup 契約: effect/event/timer 等の解除責務とスコープ単位

### コンポーネント & 制御フロー（境界の意味論）
- [ ] コンポーネント境界: cleanup スコープを持つ / 持たない
- [ ] Fragment/if/each の境界表現: コメント境界必須か、keyed list の要件
- [ ] 更新単位: テキスト/属性/リスト差分の責務（runtime vs transformer）

### リアクティビティ接続
- [ ] effect スケジューリング: 同期 / microtask / batched flush
- [ ] 公開 API 範囲: `memo` / `untrack` / `cleanup` を含めるか
- [ ] 値読み取りの規約: `.value` 固定か、アクセサ関数も許容するか

### DOM / プラットフォーム
- [ ] SSR 対象: 文字列 SSR のみ / サーバ DOM 生成も視野に入れる
- [ ] Edge 制約: Node 依存ゼロをいつから前提にするか
- [x] Web Components: Shadow DOM の hydration スコープ（DSDを第一候補、非対応はフォールバック）
- [x] Web Components: ShadowRoot は open のみ対象
- [ ] Web Components: 属性/プロパティのリフレクション規約

### DX / ツール（後回しでも契約だけ先に）
- [ ] 診断情報: ミスマッチ時にどこまで情報を出すか（境界/マーカー/期待値）
- [ ] SSR モード伝播: plugin/transformer にどうフラグを渡すか
