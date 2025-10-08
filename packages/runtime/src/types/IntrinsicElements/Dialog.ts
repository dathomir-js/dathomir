import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<dialog>` element, which represents a dialog box or interactive component.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog
 */
interface DialogIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the dialog is open */
  open?: boolean;
}

export { DialogIntrinsicElements };
