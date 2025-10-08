import { CommonIntrinsicElements } from "./Common";

type ButtonType = "submit" | "reset" | "button";

/**
 * Attributes for the `<button>` element, which represents a clickable button.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button
 */
interface ButtonIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Associates the button with a form element */
  form?: string;
  /** URL to use for form submission */
  formAction?: string;
  /** Encoding type for form submission */
  formEnctype?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  /** HTTP method for form submission */
  formMethod?: "get" | "post" | "dialog";
  /** Whether to bypass form validation */
  formNoValidate?: boolean;
  /** Where to display the response after form submission */
  formTarget?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** Name of the button */
  name?: string;
  /** Type of the button */
  type?: ButtonType;
  /** Value associated with the button's name */
  value?: string;
}

export { ButtonIntrinsicElements, ButtonType };
