import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the document `<head>` container, including legacy profile metadata.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head
 */
interface HeadIntrinsicElements extends CommonIntrinsicElements {
  /** Deprecated profile metadata URI list */
  profile?: string;
}

export { HeadIntrinsicElements };
