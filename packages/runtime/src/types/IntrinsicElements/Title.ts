import type { CommonIntrinsicElements } from "@/types/IntrinsicElements/Common";

/**
 * Attributes for the `<title>` element.
 *
 * This is intentionally permissive so the same intrinsic type can be used for
 * both HTML and SVG title elements in a shared JSX namespace.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/title
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title
 */
interface TitleIntrinsicElements extends CommonIntrinsicElements {}

export { TitleIntrinsicElements };
