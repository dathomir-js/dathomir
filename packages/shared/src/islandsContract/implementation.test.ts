import { describe, expect, it } from "vitest";

import {
  CLIENT_STRATEGY_METADATA_ATTRIBUTE,
  CLIENT_TARGET_METADATA_ATTRIBUTE,
  COLOCATED_CLIENT_STRATEGIES,
  DEFAULT_INTERACTION_EVENT_TYPE,
  ISLAND_METADATA_ATTRIBUTE,
  ISLAND_STRATEGIES,
  ISLAND_VALUE_METADATA_ATTRIBUTE,
  isColocatedClientStrategyName,
  isIslandStrategyName,
} from "./implementation";

describe("islandsContract", () => {
  it("exports canonical metadata attribute names", () => {
    expect(ISLAND_METADATA_ATTRIBUTE).toBe("data-dh-island");
    expect(ISLAND_VALUE_METADATA_ATTRIBUTE).toBe("data-dh-island-value");
    expect(CLIENT_TARGET_METADATA_ATTRIBUTE).toBe("data-dh-client-target");
    expect(CLIENT_STRATEGY_METADATA_ATTRIBUTE).toBe("data-dh-client-strategy");
  });

  it("exports canonical strategy lists", () => {
    expect(ISLAND_STRATEGIES).toEqual([
      "load",
      "visible",
      "idle",
      "interaction",
      "media",
    ]);
    expect(COLOCATED_CLIENT_STRATEGIES).toEqual([
      "load",
      "interaction",
      "visible",
      "idle",
    ]);
  });

  it("exports the default interaction event type", () => {
    expect(DEFAULT_INTERACTION_EVENT_TYPE).toBe("click");
  });

  it("accepts only known island strategies", () => {
    expect(isIslandStrategyName("load")).toBe(true);
    expect(isIslandStrategyName("visible")).toBe(true);
    expect(isIslandStrategyName("idle")).toBe(true);
    expect(isIslandStrategyName("interaction")).toBe(true);
    expect(isIslandStrategyName("media")).toBe(true);
    expect(isIslandStrategyName("typo")).toBe(false);
    expect(isIslandStrategyName(null)).toBe(false);
  });

  it("accepts only known colocated client strategies", () => {
    expect(isColocatedClientStrategyName("load")).toBe(true);
    expect(isColocatedClientStrategyName("interaction")).toBe(true);
    expect(isColocatedClientStrategyName("visible")).toBe(true);
    expect(isColocatedClientStrategyName("idle")).toBe(true);
    expect(isColocatedClientStrategyName("media")).toBe(false);
    expect(isColocatedClientStrategyName("typo")).toBe(false);
    expect(isColocatedClientStrategyName(null)).toBe(false);
  });
});
