import { CommonIntrinsicElements } from "./Common";

/**
 * Attributes for the `<title>` element, restricting children to plain text content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
 */
interface TitleIntrinsicElements extends CommonIntrinsicElements {
  /** Text content shown in the browser UI */
  children?: string;
}

export { TitleIntrinsicElements };
