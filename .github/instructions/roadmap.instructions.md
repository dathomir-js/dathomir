---
applyTo: '**'
priority: 10
---

目的: jsx を破壊的変更で VNode 生成専用に統一し、サーバー/クライアント/将来拡張 (Streaming・Hydration 差分) を単一中間表現で扱う基盤を最短で確立する。


[x] C. コア方針
	- [x] C1. jsx(): 常に純粋な VNode を返す
	- [x] C2. mount(): DOM 生成/イベント接続を担当 (jsx は純粋化)
	- [x] C3. renderToString(): VNode 走査で安全な HTML 出力
	- [x] C4. toUnreactive(): SSR で Signal/Computed を静的値化
	- [ ] C5. 後続に Hydration / Streaming / Edge 最適化を段階導入

[x] 1. Phase 1 Core Refactor & SSR MVP
	- [x] 1.1. VNode 型 & flags 最小定義
	- [x] 1.2. jsx / jsxDEV を VNode 生成へ全面移行 (旧 DOM 直生成除去)
	- [x] 1.3. mount(vNode, container) 実装 (イベント/props/reactive children)
	- [x] 1.4. toUnreactive 最小版 (Signal/Computed/配列/オブジェクト/循環/深さ制限)
	- [x] 1.5. renderToString 初期版 (escape / 属性除外 / Component / Fragment)
	- [x] 1.6. Playground を新 API (mount) に更新
	- [x] 1.7. 最小テスト (VNode 構造 / renderToString / toUnreactive)
		- [x] VNode 構造テスト (8 tests passed)
		- [x] renderToString 基本動作テスト (30 tests passed, 58.57% stmt coverage)
		- [x] toUnreactive 基本動作テスト (33 tests, 97.43% coverage)
	- [ ] 1.8. ドキュメント更新 (jsx が VNode を返す破壊的変更告知)
	- [x] 1.9. Acceptance: renderToString と mount の構造的一貫性検証
	- [x] 1.10. パフォーマンス計測 & ベンチマーク (3.08KB gzip, 1260万 JSX ops/sec, 210万 SSR ops/sec)

[ ] 2. Phase 2 Basic Hydration (再マウント方式)
	- [x] 2.1. SSR HTML 上で単純再 mount (差分なし MVP)
		- [x] hydrate(vNode, container) 関数実装 (packages/runtime/src/hydrate/index.ts)
		- [x] 公開 API エクスポート (packages/runtime/src/index.ts)
		- [x] hydrate テスト 13 件追加、100% カバレッジ
		- [x] Playground デモ (playgrounds/vanilla/hydration-demo.html)
	- [ ] 2.2. 差分 hydration 用 data-key 仕様草案作成

[ ] 3. Phase 3 Diff Hydration & State Transfer
	- [ ] 3.1. data-key 埋め込み & DOM 走査で既存ノード対応付け
	- [ ] 3.2. window.__ZABRAK_STATE__ へ初期 Signal 値シリアライズ
	- [ ] 3.3. 差分適用アルゴリズム & 不整合時フォールバック (再マウント)

[ ] 4. Phase 4 Streaming & Edge Adaptation
	- [ ] 4.1. renderToReadableStream チャンク逐次出力
	- [ ] 4.2. Edge (workerd 等) 対応 build / noExternal 調整
	- [ ] 4.3. ストリーミング中 Signal 一貫性ガード

[ ] 5. Phase 5 Environment & Optimization
	- [ ] 5.1. Vite Environment API 深度活用 (client/ssr/edge 分離)
	- [ ] 5.2. 環境 define (__ZABRAK_ENV__) 注入
	- [ ] 5.3. パフォーマンス計測 & キャッシュ層導入

[ ] 6. Phase 6 DX & Advanced Features
	- [ ] 6.1. CLI テンプレート (create zabrak)
	- [ ] 6.2. 型統合 (SSR/CSR jsx 差異吸収オーバーロード整理)
	- [ ] 6.3. Suspense / Async (Promise) 下地
	- [ ] 6.4. DevTools Hook / ドキュメント拡充 / サンプル集

[ ] R. リスク対策
	- [ ] R1. 破壊的変更周知 (CHANGELOG / README 冒頭)
	- [ ] R2. VNode 公開型最小化 (内部 flags は外部非公開)
	- [ ] R3. XSS 防止 (escape 徹底・on* 属性除外ポリシー)


