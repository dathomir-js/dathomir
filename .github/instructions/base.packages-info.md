---
applyTo: '**'
priority: 9999
# latestUpdated: "2025-11-05"
---

# Dathomir package 仕様草案作成

## `@dathomir/core`

### 目的
dathomir の利用者が最も基本的に使用するパッケージであり、dathomir のほぼ全ての機能を提供する。

### 仕様
以下のパケージを再エクスポートする形で提供する。
- `@dathomir/reactivity`
- `@dathomir/runtime`
- `@dathomir/shared`

追加で、以下の機能を提供する。
- `core/createCustomElement.ts` : custom element ベースのコンポーネントを作成するための関数
- `core/Props.ts` : createCustomElement の props の型定義を提供するユーティリティ型

## `@dathomir/plugin`

### 目的
dathomir の開発・ビルド時にファイル変更を検知し、`@dathomir/transformer` を呼び出して、JSX ソースを `@dathomir/runtime` 対応のリアクティブに計算されるコードに変換する。

### 仕様
- ファイル変更を検知する
- `@dathomir/transformer` を呼び出し、TSC 等でトランスパイル済みの JS/TS ファイルをリアクティブに計算されるコード（`computed()`を囲った状態）に変換する

## `@dathomir/reactivity`

### 目的

### 仕様

## `@dathomir/runtime`

### 目的

### 仕様

## `@dathomir/transformer`

### 目的

### 仕様

## `@dathomir/shared`

### 目的

### 仕様