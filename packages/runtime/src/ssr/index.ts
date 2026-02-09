/**
 * SSR (Server-Side Rendering) module exports.
 * Provides functions for rendering structured arrays to HTML strings.
 */

export { createMarker, MarkerType } from "./markers/implementation";
export {
  renderToString,
  renderTree,
  setComponentRenderer,
} from "./render/implementation";
export type {
  ComponentRenderer,
  RenderContext,
  RenderOptions,
} from "./render/implementation";
export { serializeState } from "./serialize/implementation";
export type {
  SerializableValue,
  StateObject,
} from "./serialize/implementation";
