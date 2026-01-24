#set text(font: "Noto Sans JP", size: 10pt)
#set text(weight: "thin")       // 100
#set text(weight: "extralight") // 200
#set text(weight: "light")      // 300
#set text(weight: "regular")    // 400
#set text(weight: "medium")     // 500
#set text(weight: "semibold")   // 600
#set text(weight: "bold")       // 700
#set text(weight: "extrabold")  // 800
#set text(weight: "black")      // 900

#let Status = (
  Proposed: "Proposed",
  Accepted: "Accepted",
  Rejected: "Rejected",
  Deprecated: "Deprecated",
  Superseded: "Superseded",
)
#let header(title, status, date) = {
  assert(
    status in Status.values(),
    message: "ADR status must be one of: " + repr(Status.values()) + ", got: " + repr(status),
  )
  [
    === ADR: #title

    *Status:* #status
    *Date:* #date
  ]
}
#let adr(
  header,
  contexts,
  decisions,
  consequences,
  alternatives: none,
  references: none,
) = {
  if references != none {
    assert(
      type(references) == array,
      message: "references must be an array of link() calls, got: " + repr(type(references)),
    )
  }
  [
    #header

    ==== Context
    #contexts

    ==== Decision
    #decisions

    ==== Consequences
    #consequences

    #if alternatives != none [
      ==== Alternatives Considered
      #alternatives
    ]

    #if references != none [
      ==== References
      #for ref in references [
        - #ref
      ]
    ]
  ]
}

= SPEC.typ

== 目的

VNode ベースアーキテクチャから *SolidJS スタイルの Fine-grained Reactivity + Direct DOM* への全面移行。

TC39 Signals (alien-signals) を活用し、Compiler-First アプローチでどこよりも高速・軽量・独自性のあるフレームワークを構築する。

*破壊的変更度* : 100% (完全な書き直し)

*期待パフォーマンス向上* : 3-5x

*目標バンドルサイズ* : < 2KB (現在 3.08KB)


== 🏗️ Architecture Decision (2025-12-01)

*採用するアプローチ*: SolidJS ベースの Fine-grained Reactivity
- VNode システムを完全削除
- JSX → Direct DOM compilation
- Template cloning + createElement のハイブリッド戦略
- Compiler-assisted SSR state serialization

*独自性*:
1. TC39 Signals API (`.value` アクセス)
2. alien-signals (50% 高速)
3. 自動 Signal シリアライズ (SSR→CSR)
4. Web Components first-class support
5. Edge runtime 最適化
6. より明示的なコンパイル出力

== ADR

#adr(
  header("My ADR Title", Status.Accepted, "2024-06-15"),
  [
    This is the context of the decision.
    You can use *bold*, _italic_, and other Typst markup here.
  ],
  [
    This is the decision made.

    - You can use lists
    - With multiple items
    - And `inline code`
  ],
  [
    These are the consequences of the decision.

    ```ts
    // You can even include code blocks
    const example = "code";
    ```
  ],
  alternatives: [
    We considered several alternatives:

    1. Alternative A
    2. Alternative B
    3. test
  ],
  references: (
    link("https://example.com")[Reference 1],
    link("https://example.com")[Reference 2],
    link("https://example.com")[Reference 3],
  ),
)
