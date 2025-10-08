import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<colgroup>` element, which defines a group of columns within a table.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/colgroup
 */
interface ColgroupIntrinsicElements extends CommonIntrinsicElements {
  /** Number of columns the element should span */
  span?: number;
}

export { ColgroupIntrinsicElements };
