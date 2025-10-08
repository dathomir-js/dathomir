import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<hr>` element, which represents a thematic break between paragraphs.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/hr
 */
interface HrIntrinsicElements extends CommonIntrinsicElements {
  /** <hr> is a void element */
  children?: never;
}

export { HrIntrinsicElements };
