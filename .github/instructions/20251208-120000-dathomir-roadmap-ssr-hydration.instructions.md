---
applyTo: '**'
priority: 1
archived: true
---

# Chat History: dathomir-roadmap-ssr-hydration

**Date**: 2025-12-08 12:00:00

Copilot: mode=`agent`, model=`GPT-5 mini`

---

## Conversation

user:
今のロードマップは理解できる？

copilot:
## Plan: ロードマップ理解共有

ロードマップ全体を把握しており、VNode廃止→Direct DOM＋Signalsへの全面再設計、フェーズ別ゴール・成功指標・破壊的変更・移行パスを把握しました。この理解をユーザーと擦り合わせるための確認ステップを提示します。

### Steps
1. `AGENTS.md`の言語/禁止事項と`.github/instructions/roadmap.instructions.md`の方針を要点で共有する。
2. フェーズR1–R6の目的と主要デリバブル（transformer-v2/runtime-v2/SSR/Edge/WC/DX/最終仕上げ）を簡潔に説明する。
3. 破壊的変更点（jsxがDOM返却、mount削除→render、toUnreactive削除等）と成功指標/タイムラインを確認する。
4. リスクと移行パス（codemod、互換レイヤー、ガイド）を伝え、優先確認事項を質問する。

### Further Considerations
1. 最初に深掘りするフェーズはR1（コンパイラ）で良いですか？R2（ランタイム）優先など希望はありますか？

user:
現状solid.jsの方式を取っているけど、solidにこだわるつもりはない
ただ、soildのSSRでdomを構築して、その後scriptタグを使って、domにイベントやリアクティブ化を行うという考えは取り入れていきたい
あと、できるだけ @dathomir/transformer の実装量は減らしていきたい

copilot:
- 言語指定: すべて日本語で応答。コードコメントは英語（AGENTS）。  
- 禁止事項: 明示許可なしのテスト削除・変更、テスト自動生成、新規Markdown作成、スコープ外変更、適切な検証なしの完了宣言をしない。  
- 全体方針: VNodeベースを廃止し、SolidJS型のファイングレインドリアクティビティ＋Direct DOMへ全面書き直し。破壊的変更度100%、目標バンドル <2KB、性能3–5倍。  
- フェーズ概要:  
  - R1 (第1-3週): トランスフォーマー再設計・Direct DOMコード生成・動的/静的判別・効果生成、50+ユニット/スナップショット/統合テスト。成果物: `@dathomir/transformer-v2`。  
  - R2 (第4-6週): ランタイム再実装、VNode削除、新API `render/hydrate/template/insert`、SignalsユーティリティとDOMヘルパー、100+テスト・ベンチ。成果物: `@dathomir/runtime-v2` (<2KB)。  
  - R3 (第7-8週): SSRモード、文字列生成・コメントマーカー、状態シリアライズと復元、ハイドレーション戦略、性能ベンチ（目標1,000万+ ops/sec）。  
  - R4 (第9-10週): Edge最適化（CF Workers/Deno）、Node依存ゼロ確認、ストリーミングSSR、Suspense/非同期対応。  
  - R5 (第11-12週): Web Components統合（Shadow DOM/ライフサイクル/属性反映）、TS型/型ヘルパー、開発者ツール、ドキュメント・サンプル・CLI。  
  - R6 (第13-14週): 最終最適化・デッドコード削除・サイズ削減、性能/安定性/クロスブラウザ、リリース準備（CHANGELOG・codemod・v2.0.0アナウンス）。  
- 破壊的変更点: `jsx()`がDOMノードを返す、`mount()`削除→`render()`, コンポーネント型がElement返却へ、`toUnreactive()`削除、手動`computed`ラップ不要。  
- 成功指標: コンパイル5,000万+ ops/sec、SSR1,000万+、初期レンダ<1ms、Signal更新<0.1ms、ハイドレ<0.5ms。バンドル: ランタイム<2KB gzip、SSR含む<4KB、フル<8KB。DX: TS100%、テスト90%+、ビルド<100ms、明確なエラーメッセージ。  
- リスクと対策: コンパイラ複雑性→段階的最適化、破壊的変更→移行ガイド/codemod、SSRシリアライズエッジ→包括テスト、Edge互換→早期全プラットフォーム検証。対策M1 v1維持、M2 runtime-v2プロトタイプ、M3継続ベンチ、M4 RFCでフィードバック。  
- 移行パス: codemod、自動/互換レイヤー、ステップガイド、新旧比較ドキュメント。  
- 完了定義: サブタスク完了、テスト>80%かつ全通過、ベンチで改善、ドキュメント更新、レビュー承認、ブロッキングバグなし。  
- タイムライン: R1 2025-12-22完、R2 2026-01-12、R3 2026-01-26、R4 2026-02-09、R5 2026-02-23、R6 2026-03-09（全14週でv2.0.0）。

copilot:
## Plan: SSRハイドレーション簡素化案

サーバーでHTML/DOMを構築し、クライアントは既存DOMを再利用してイベントとリアクティブ性だけを付与するSolid風パターンに寄せ、複雑化したtransformerを最小限の「テンプレート＋操作テーブル」出力に置き換える方向を整理します。

### Steps
1. `packages/runtime`における新API契約を決める（`hydrate(fn, root)`/`render`役割分離、既存DOM再利用か再生成か、動的部のマーカー形式）。
2. SSR出力仕様を定義する（コメントマーカーか`data-hk`属性で動的ノード/属性を識別、イベント/Signal登録用IDの付与方針）。
3. transformerの役割縮小案を設計する（JSX→静的HTML文字列＋動的操作リスト生成、Babel visitorの最小セット化、既存14k行distの置換計画）。
4. runtime側ハイドレーション処理の責務を設計する（マーカー探索→テキスト/属性のeffect装着、イベント再バインド、Computed再構築の方法）。
5. 移行/互換戦略を決める（現VNodeレンダリングは維持しつつ新ハイドレーションパスをフラグで併存、段階的にtransformer差し替え）。

### Further Considerations
1. マーカー方式はコメント(`<!--hk:x-->`)と属性(`data-hk`)のどちらを優先しますか？
2. transformer再実装は「ミニマル新規書き直し」か「既存distの段階的縮小」か、どちらを選びますか？

user:
Follow instructions in [export-chat.prompt.md](vscode-remote://wsl%2Bubuntu/home/kcatt/dev/dathomir/.github/prompts/export-chat.prompt.md). (See <attachments> above for file contents. You may not need to search or read the file again.)

---

**End of conversation**
