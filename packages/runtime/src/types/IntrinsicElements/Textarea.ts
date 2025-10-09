import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<textarea>` element, which represents a multi-line plain text editing control.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/textarea
 */
interface TextareaIntrinsicElements
  extends Omit<CommonIntrinsicElements, "onInput" | "onChange"> {
  // Override event handlers with more specific types for textarea elements
  /** Input event handler with HTMLTextAreaElement target */
  onInput?: (
    event: InputEvent & { target: HTMLTextAreaElement | null }
  ) => void;
  /** Change event handler with HTMLTextAreaElement target */
  onChange?: (event: Event & { target: HTMLTextAreaElement | null }) => void;

  /** Whether the textarea should have autocomplete enabled */
  autoComplete?: string;
  /** Whether the textarea should automatically get focus */
  autoFocus?: boolean;
  /** Visible width of the text control in average character widths */
  cols?: number;
  /** Default value for the textarea */
  defaultValue?: string;
  /** Name of the form control to use for sending the dirname */
  dirName?: string;
  /** Whether the textarea is disabled */
  disabled?: boolean;
  /** Associates the textarea with a form element */
  form?: string;
  /** Maximum length of value */
  maxLength?: number;
  /** Minimum length of value */
  minLength?: number;
  /** Name of the textarea */
  name?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the textarea is read-only */
  readOnly?: boolean;
  /** Whether the textarea is required */
  required?: boolean;
  /** Number of visible text lines */
  rows?: number;
  /** How the text should be wrapped */
  wrap?: "hard" | "soft" | "off";
}

export { TextareaIntrinsicElements };
