/**
 * Hydration module exports.
 * Provides functions for hydrating SSR-rendered DOM.
 */

export {
  cancelScheduledIslandHydration,
  createHydrationContext,
  hydrate,
  hydrateIslands,
  hydrateRoot,
  HydrationMismatchError,
  HYDRATE_ISLANDS_HOOK,
  HYDRATE_ISLANDS_STATUS,
  isHydrated,
  hydrateTextMarker,
} from "./hydrate/implementation";
export type {
  HydrateIslandHook,
  HydrateIslandsStatus,
  HydrationContext,
  IslandHydrationTrigger,
  IslandHost,
} from "./hydrate/implementation";

export { createWalker, findMarker, findMarkers } from "./walker/implementation";
export type { MarkerInfo } from "./walker/implementation";

export {
  deserializeState,
  parseStoreScript,
  parseStateScript,
} from "./deserialize/implementation";
