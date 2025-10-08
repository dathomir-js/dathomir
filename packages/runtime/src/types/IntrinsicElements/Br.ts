import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<br>` element, which produces a line break.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/br
 */
interface BrIntrinsicElements extends CommonIntrinsicElements {
  /** <br> is a void element */
  children?: never;
}

export { BrIntrinsicElements };
