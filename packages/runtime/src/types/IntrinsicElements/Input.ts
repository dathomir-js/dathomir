import { CommonIntrinsicElements } from "./Common";

type InputType =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

/**
 * Attributes for the `<input>` element, which creates interactive controls for web forms.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
 */
interface InputIntrinsicElements extends CommonIntrinsicElements {
  /** Hint for expected file type in file upload controls */
  accept?: string;
  /** Alternative text for image inputs */
  alt?: string;
  /** Whether the input should have autocomplete enabled */
  autoComplete?: string;
  /** Whether the input should automatically get focus */
  autoFocus?: boolean;
  /** Whether the input's value can be manipulated by the user */
  capture?: boolean | "user" | "environment";
  /** Whether the checkbox/radio is checked */
  checked?: boolean;
  /** Default checked state for checkbox/radio */
  defaultChecked?: boolean;
  /** Default value for the input */
  defaultValue?: string | number;
  /** Name of the form control to use for sending the dirname */
  dirName?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Associates the input with a form element */
  form?: string;
  /** URL to use for form submission (submit/image buttons) */
  formAction?: string;
  /** Encoding type for form submission */
  formEnctype?: "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
  /** HTTP method for form submission */
  formMethod?: "get" | "post" | "dialog";
  /** Whether to bypass form validation */
  formNoValidate?: boolean;
  /** Where to display the response after form submission */
  formTarget?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** Height of the image input */
  height?: number | string;
  /** References a datalist element */
  list?: string;
  /** Maximum value */
  max?: number | string;
  /** Maximum length of value */
  maxLength?: number;
  /** Minimum value */
  min?: number | string;
  /** Minimum length of value */
  minLength?: number;
  /** Whether to allow multiple values */
  multiple?: boolean;
  /** Name of the input */
  name?: string;
  /** Pattern the value must match */
  pattern?: string;
  /** Placeholder text */
  placeholder?: string;
  /** ID of the popover element to control */
  popovertarget?: string;
  /** Action to perform on the popover */
  popovertargetaction?: "hide" | "show" | "toggle";
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Size of the input */
  size?: number;
  /** URL for image input */
  src?: string;
  /** Granularity of the value */
  step?: number | string;
  /** Type of input control */
  type?: InputType;
  /** Value of the input */
  value?: string | number;
  /** Width of the image input */
  width?: number | string;
  /** <input> is a void element */
  children?: never;
}

export { InputIntrinsicElements, InputType };
