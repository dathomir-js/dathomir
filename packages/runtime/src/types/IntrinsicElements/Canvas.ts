import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<canvas>` element, which is used to draw graphics via JavaScript.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/canvas
 */
interface CanvasIntrinsicElements extends CommonIntrinsicElements {
  /** Height of the canvas in pixels */
  height?: number | string;
  /** Width of the canvas in pixels */
  width?: number | string;
}

export { CanvasIntrinsicElements };
