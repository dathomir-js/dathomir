import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<li>` element, which represents an item in a list.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/li
 */
interface LiIntrinsicElements extends CommonIntrinsicElements {
  /** Ordinal value of the list item (for ordered lists) */
  value?: number;
}

export { LiIntrinsicElements };
