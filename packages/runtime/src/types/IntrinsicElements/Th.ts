import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<th>` element, which defines a header cell in a table.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/th
 */
interface ThIntrinsicElements extends CommonIntrinsicElements {
  /** Abbreviated version of the header content */
  abbr?: string;
  /** Number of columns the cell should span */
  colSpan?: number;
  /** Space-separated list of header cell IDs */
  headers?: string;
  /** Number of rows the cell should span */
  rowSpan?: number;
  /** Type of header cell */
  scope?: "row" | "col" | "rowgroup" | "colgroup";
}

export { ThIntrinsicElements };
