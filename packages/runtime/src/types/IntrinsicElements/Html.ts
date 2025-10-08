import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes available on the root `<html>` element.
 * Extends global attributes with namespace and legacy version metadata.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/html
 */
interface HtmlIntrinsicElements extends CommonIntrinsicElements {
  /** Document namespace URI */
  xmlns?: string;
  /** Deprecated HTML version identifier */
  version?: string;
}

export { HtmlIntrinsicElements };
