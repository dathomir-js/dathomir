import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

type FormEnctype = "application/x-www-form-urlencoded" | "multipart/form-data" | "text/plain";
type FormMethod = "get" | "post" | "dialog";
type FormTarget = "_self" | "_blank" | "_parent" | "_top" | (string & {});

/**
 * Attributes for the `<form>` element, which represents a document section containing interactive controls.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form
 */
interface FormIntrinsicElements extends CommonIntrinsicElements {
  /** Character encodings to use for form submission */
  acceptCharset?: string;
  /** URL to process the form submission */
  action?: string;
  /** Whether the form should have autocomplete enabled */
  autoComplete?: "on" | "off";
  /** Encoding type for form submission */
  enctype?: FormEnctype;
  /** HTTP method to use for form submission */
  method?: FormMethod;
  /** Name of the form */
  name?: string;
  /** Whether to bypass form validation on submission */
  noValidate?: boolean;
  /** Relationship between current document and linked URL */
  rel?: string;
  /** Where to display the response after form submission */
  target?: FormTarget;
}

export { FormIntrinsicElements, FormEnctype, FormMethod, FormTarget };
