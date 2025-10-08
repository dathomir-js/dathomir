import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes supported by the `<base>` element for resolving relative URLs.
 * Restricts children and augments global attributes with navigation metadata.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base
 */
interface BaseIntrinsicElements extends CommonIntrinsicElements {
  /** Document base URL for resolving relative links */
  href?: string;
  /** Default browsing context for navigation */
  target?: "_self" | "_blank" | "_parent" | "_top" | (string & {});
  /** <base> is a void element */
  children?: never;
}

export { BaseIntrinsicElements };
