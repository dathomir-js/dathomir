// DOM generation
export { fromTree } from "./dom/fromTree/implementation";

// DOM navigation
export { firstChild, nextSibling } from "./dom/navigation/implementation";

// DOM text
export { setText } from "./dom/text/implementation";

// DOM attributes and properties
export { setAttr, setProp } from "./dom/attr/implementation";

// DOM spread
export { spread } from "./dom/spread/implementation";
export type { SpreadProps } from "./dom/spread/implementation";

// DOM insertion
export { append, insert } from "./dom/insertion/implementation";

// List reconciliation
export { reconcile } from "./reconcile/implementation";

// Events
export { event } from "./events/implementation";

// Reactivity (re-exported from @dathomir/reactivity)
export { createRoot, onCleanup, templateEffect } from "@dathomir/reactivity";
export type { Owner, RootDispose } from "@dathomir/reactivity";

// Tree types
export { Namespace } from "./types/tree";
export type {
  Attrs,
  Placeholder,
  PlaceholderType,
  TextContent,
  Tree,
  TreeNode,
} from "./types/tree";

// SSR (Server-Side Rendering)
export {
  createMarker,
  MarkerType,
  renderToString,
  renderTree,
  serializeState,
} from "./ssr/index";
export type { RenderContext, RenderOptions } from "./ssr/index";
export type {
  SerializableValue,
  StateObject,
} from "./ssr/serialize/implementation";

// Hydration
export {
  createHydrationContext,
  createWalker,
  deserializeState,
  findMarker,
  hydrate,
  hydrateRoot,
  HydrationMismatchError,
  isHydrated,
  parseStateScript,
} from "./hydration/index";
export type { HydrationContext, MarkerInfo } from "./hydration/index";
