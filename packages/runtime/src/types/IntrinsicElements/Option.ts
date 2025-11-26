import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<option>` element, which defines an item in a select, optgroup, or datalist.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/option
 */
interface OptionIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the option is disabled */
  disabled?: boolean;
  /** Label for the option */
  label?: string;
  /** Whether the option is selected by default */
  selected?: boolean;
  /** Value to be submitted with the form */
  value?: string | number;
}

export { OptionIntrinsicElements };
