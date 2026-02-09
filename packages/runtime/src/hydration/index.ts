/**
 * Hydration module exports.
 * Provides functions for hydrating SSR-rendered DOM.
 */

export {
  createHydrationContext,
  hydrate,
  hydrateRoot,
  HydrationMismatchError,
  isHydrated,
} from "./hydrate/implementation";
export type { HydrationContext } from "./hydrate/implementation";

export { createWalker, findMarker, findMarkers } from "./walker/implementation";
export type { MarkerInfo } from "./walker/implementation";

export {
  deserializeState,
  parseStateScript,
} from "./deserialize/implementation";
