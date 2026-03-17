const ISLAND_METADATA_ATTRIBUTE = "data-dh-island" as const;
const ISLAND_VALUE_METADATA_ATTRIBUTE = "data-dh-island-value" as const;
const CLIENT_TARGET_METADATA_ATTRIBUTE = "data-dh-client-target" as const;
const CLIENT_STRATEGY_METADATA_ATTRIBUTE = "data-dh-client-strategy" as const;
const DEFAULT_INTERACTION_EVENT_TYPE = "click" as const;

const ISLAND_STRATEGIES = [
  "load",
  "visible",
  "idle",
  "interaction",
  "media",
] as const;

const COLOCATED_CLIENT_STRATEGIES = [
  "load",
  "interaction",
  "visible",
  "idle",
] as const;

type IslandStrategyName = (typeof ISLAND_STRATEGIES)[number];
type ColocatedClientStrategyName = (typeof COLOCATED_CLIENT_STRATEGIES)[number];

const islandStrategySet = new Set<string>(ISLAND_STRATEGIES);
const colocatedClientStrategySet = new Set<string>(COLOCATED_CLIENT_STRATEGIES);

function isIslandStrategyName(
  value: string | null,
): value is IslandStrategyName {
  return typeof value === "string" && islandStrategySet.has(value);
}

function isColocatedClientStrategyName(
  value: string | null,
): value is ColocatedClientStrategyName {
  return typeof value === "string" && colocatedClientStrategySet.has(value);
}

export {
  CLIENT_STRATEGY_METADATA_ATTRIBUTE,
  CLIENT_TARGET_METADATA_ATTRIBUTE,
  COLOCATED_CLIENT_STRATEGIES,
  DEFAULT_INTERACTION_EVENT_TYPE,
  ISLAND_METADATA_ATTRIBUTE,
  ISLAND_STRATEGIES,
  ISLAND_VALUE_METADATA_ATTRIBUTE,
  isColocatedClientStrategyName,
  isIslandStrategyName,
};
export type { ColocatedClientStrategyName, IslandStrategyName };
