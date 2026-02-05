// DOM generation
export { fromTree } from "./dom/fromTree";

// DOM navigation
export { firstChild, nextSibling } from "./dom/navigation";

// DOM text
export { setText } from "./dom/text";

// DOM attributes and properties
export { setAttr, setProp } from "./dom/attr";

// DOM spread
export { spread } from "./dom/spread";
export type { SpreadProps } from "./dom/spread";

// DOM insertion
export { append, insert } from "./dom/insertion";

// List reconciliation
export { reconcile } from "./reconcile/index";

// Events
export { event } from "./events/index";

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
