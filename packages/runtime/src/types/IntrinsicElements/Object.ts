import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<object>` element, which embeds external resources.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/object
 */
interface ObjectIntrinsicElements extends CommonIntrinsicElements {
  /** URL of the resource */
  data?: string;
  /** Associated form element */
  form?: string;
  /** Height of the embedded content */
  height?: number | string;
  /** Name of the browsing context */
  name?: string;
  /** MIME type of the resource */
  type?: string;
  /** Image map to use with the object */
  useMap?: string;
  /** Width of the embedded content */
  width?: number | string;
}

export { ObjectIntrinsicElements };
