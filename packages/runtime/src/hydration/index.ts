/**
 * Hydration module exports.
 * Provides functions for hydrating SSR-rendered DOM.
 */

export {
  cancelScheduledIslandHydration,
  clearClientActions,
  createHydrationContext,
  getClientAction,
  hydrate,
  hydrateIslands,
  hydrateRoot,
  hydrateWithPlan,
  HydrationMismatchError,
  HYDRATE_ISLANDS_HOOK,
  HYDRATE_ISLANDS_STATUS,
  isHydrated,
  hydrateTextMarker,
  registerClientAction,
} from "./hydrate/implementation";
export type {
  AttrBinding,
  EventBinding,
  GenericHydrationPlan,
  HydrateIslandHook,
  HydrateIslandsStatus,
  HydrationBinding,
  HydrationContext,
  InsertBinding,
  IslandHydrationTrigger,
  IslandHost,
  NestedBoundaryRef,
  SpreadBinding,
  TextBinding,
} from "./hydrate/implementation";

export { createWalker, findMarker, findMarkers } from "./walker/implementation";
export type { MarkerInfo } from "./walker/implementation";

export {
  deserializeState,
  parseStoreScript,
  parseStateScript,
} from "./deserialize/implementation";
