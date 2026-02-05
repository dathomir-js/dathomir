/**
 * Transform options for the Dathomir transformer.
 */
interface TransformOptions {
  /**
   * Transformation mode.
   * - 'csr': Client-side rendering (default)
   * - 'ssr': Server-side rendering (Phase 2)
   */
  mode?: "csr" | "ssr";

  /**
   * Whether to generate source maps.
   */
  sourceMap?: boolean;

  /**
   * The file name for source map generation.
   */
  filename?: string;

  /**
   * The module to import runtime functions from.
   * Default: '@dathomir/runtime'
   */
  runtimeModule?: string;
}

/**
 * Result of a transformation.
 */
interface TransformResult {
  /**
   * The transformed code.
   */
  code: string;

  /**
   * Source map (if requested).
   */
  map?: string;
}

export type { TransformOptions, TransformResult };
