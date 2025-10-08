import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<col>` element, which defines a column within a table.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/col
 */
interface ColIntrinsicElements extends CommonIntrinsicElements {
  /** Number of columns the element should span */
  span?: number;
  /** <col> is a void element */
  children?: never;
}

export { ColIntrinsicElements };
