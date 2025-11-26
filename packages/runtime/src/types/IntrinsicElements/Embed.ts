import { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<embed>` element, which embeds external content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/embed
 */
interface EmbedIntrinsicElements extends CommonIntrinsicElements {
  /** Height of the embedded content */
  height?: number | string;
  /** URL of the resource being embedded */
  src?: string;
  /** MIME type of the embedded content */
  type?: string;
  /** Width of the embedded content */
  width?: number | string;
  /** <embed> is a void element */
  children?: never;
}

export { EmbedIntrinsicElements };
