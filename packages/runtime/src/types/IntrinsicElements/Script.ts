import { CommonIntrinsicElements } from "./Common";

type ScriptReferrerPolicy =
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

type ScriptBlocking = "render";

/**
 * Attributes for the `<script>` element, which embeds or references executable code.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script
 */
interface ScriptIntrinsicElements extends CommonIntrinsicElements {
  /** Execute the script asynchronously */
  async?: boolean;
  /** Blocks rendering until the script loads */
  blocking?: ScriptBlocking;
  /** CORS settings for the script */
  crossOrigin?: "anonymous" | "use-credentials";
  /** Execute the script after the document has been parsed */
  defer?: boolean;
  /** Relative importance for resource loading */
  fetchPriority?: "high" | "low" | "auto";
  /** Subresource integrity value */
  integrity?: string;
  /** Whether the script should not be executed */
  noModule?: boolean;
  /** Referrer policy for fetches initiated by the script */
  referrerPolicy?: ScriptReferrerPolicy;
  /** URL of an external script */
  src?: string;
  /** Type of script */
  type?: string;
}

export { ScriptIntrinsicElements, ScriptReferrerPolicy, ScriptBlocking };
