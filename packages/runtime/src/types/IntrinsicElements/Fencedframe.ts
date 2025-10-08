import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<fencedframe>` element, which represents a secure embedded frame.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fencedframe
 */
interface FencedframeIntrinsicElements extends CommonIntrinsicElements {
  /** Height of the fenced frame */
  height?: number | string;
  /** Width of the fenced frame */
  width?: number | string;
}

export { FencedframeIntrinsicElements };
