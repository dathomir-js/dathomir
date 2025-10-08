import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<output>` element, which represents the result of a calculation.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/output
 */
interface OutputIntrinsicElements extends CommonIntrinsicElements {
  /** Space-separated list of IDs of elements that contributed to the output */
  for?: string;
  /** Associates the output with a form element */
  form?: string;
  /** Name of the output */
  name?: string;
}

export { OutputIntrinsicElements };
