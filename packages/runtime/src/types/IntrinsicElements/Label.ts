import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<label>` element, which represents a caption for a form control.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label
 */
interface LabelIntrinsicElements extends CommonIntrinsicElements {
  /** ID of the form control with which to associate the label */
  htmlFor?: string;
}

export { LabelIntrinsicElements };
