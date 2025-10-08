import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<select>` element, which represents a control for selecting amongst a set of options.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/select
 */
interface SelectIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the select should have autocomplete enabled */
  autoComplete?: string;
  /** Whether the select should automatically get focus */
  autoFocus?: boolean;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Associates the select with a form element */
  form?: string;
  /** Whether to allow multiple selections */
  multiple?: boolean;
  /** Name of the select */
  name?: string;
  /** Whether the select is required */
  required?: boolean;
  /** Number of visible options */
  size?: number;
}

export { SelectIntrinsicElements };
