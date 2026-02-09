/**
 * SSR (Server-Side Rendering) module exports.
 * Provides functions for rendering structured arrays to HTML strings.
 */

export { MarkerType, createMarker } from "./markers/implementation";
export { renderToString, renderTree } from "./render/implementation";
export type { RenderContext, RenderOptions } from "./render/implementation";
export { serializeState } from "./serialize/implementation";
export type {
  SerializableValue,
  StateObject,
} from "./serialize/implementation";
