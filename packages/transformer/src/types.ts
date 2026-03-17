import type {
  ColocatedClientStrategyName,
  IslandStrategyName,
} from "@dathomir/shared";

/**
 * Transform options for the Dathomir transformer.
 */
interface TransformOptions {
  /**
   * Transformation mode.
   * - 'csr': Client-side rendering (default)
   * - 'ssr': Server-side rendering
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

interface IslandsMetadataContract {
  hostMetadataAttribute: "data-dh-island";
  hostValueMetadataAttribute: "data-dh-island-value";
  clientTargetMetadataAttribute: "data-dh-client-target";
  clientStrategyMetadataAttribute: "data-dh-client-strategy";
  defaultInteractionEventType: "click";
  hostStrategies: readonly IslandStrategyName[];
  colocatedStrategies: readonly ColocatedClientStrategyName[];
}

export type { IslandsMetadataContract, TransformOptions, TransformResult };
