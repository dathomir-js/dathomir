import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<td>` element, which defines a cell in a table.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/td
 */
interface TdIntrinsicElements extends CommonIntrinsicElements {
  /** Number of columns the cell should span */
  colSpan?: number;
  /** Space-separated list of header cell IDs */
  headers?: string;
  /** Number of rows the cell should span */
  rowSpan?: number;
}

export { TdIntrinsicElements };
