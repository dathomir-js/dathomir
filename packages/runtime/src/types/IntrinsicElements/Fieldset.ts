import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<fieldset>` element, which groups related form controls.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/fieldset
 */
interface FieldsetIntrinsicElements extends CommonIntrinsicElements {
  /** Whether the fieldset is disabled */
  disabled?: boolean;
  /** Associates the fieldset with a form element */
  form?: string;
  /** Name of the fieldset */
  name?: string;
}

export { FieldsetIntrinsicElements };
