= islands metadata contract

#import "/SPEC/functions.typ": *
#import "/SPEC/settings.typ": *
#show: apply-settings

== 目的

transformer・runtime・plugin が共有する islands metadata contract を 1 箇所へ集約する。

== 機能仕様

#feature_spec(
  name: "islands metadata contract",
  summary: [
    host-level islands metadata と colocated client marker metadata の attribute 名、strategy 名、基本ガードを canonical utility として提供する。
  ],
  api: [
    ```typescript
    const ISLAND_METADATA_ATTRIBUTE: "data-dh-island"
    const ISLAND_VALUE_METADATA_ATTRIBUTE: "data-dh-island-value"
    const CLIENT_TARGET_METADATA_ATTRIBUTE: "data-dh-client-target"
    const CLIENT_STRATEGY_METADATA_ATTRIBUTE: "data-dh-client-strategy"
    const DEFAULT_INTERACTION_EVENT_TYPE: "click"

    const ISLAND_STRATEGIES: readonly [
      "load",
      "visible",
      "idle",
      "interaction",
      "media"
    ]

    const COLOCATED_CLIENT_STRATEGIES: readonly [
      "load",
      "interaction",
      "visible",
      "idle"
    ]

    type IslandStrategyName = (typeof ISLAND_STRATEGIES)[number]
    type ColocatedClientStrategyName =
      (typeof COLOCATED_CLIENT_STRATEGIES)[number]

    function isIslandStrategyName(
      value: string | null
    ): value is IslandStrategyName

    function isColocatedClientStrategyName(
      value: string | null
    ): value is ColocatedClientStrategyName
    ```
  ],
  impl_notes: [
    - contract utility 自体は pure data / pure guard のみを持つ
    - strategy 名と metadata attribute 名は runtime 文字列 contract の canonical source として扱う
    - colocated strategy は host strategy の strict subset とする
  ],
  test_cases: [
    - canonical metadata attribute 名を公開する
    - canonical strategy 一覧を公開する
    - interaction の default event type を公開する
    - `isIslandStrategyName()` が有効値だけを true にする
    - `isColocatedClientStrategyName()` が colocated 対象だけを true にする
  ],
)
