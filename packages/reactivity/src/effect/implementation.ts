/**
 * Effect implementation - reactive side effect.
 * @module
 */
import { createEffectNode } from "../internal/helpers";
import {
  effectCleanup,
  link,
  setActiveSub,
  unsetActiveSub,
} from "../internal/system";
import type { EffectCleanup } from "../types";

/**
 * Register a reactive side-effect that re-runs when tracked dependencies change.
 * @param {() => void} fn Effect function to execute and track.
 * @returns {EffectCleanup} Cleanup function that stops the effect.
 */
function effect(fn: () => void): EffectCleanup {
  const effectNode = createEffectNode(fn);
  const prevSub = setActiveSub(effectNode);
  if (prevSub !== undefined) {
    link(effectNode, prevSub, 0);
  }
  try {
    fn();
  } finally {
    unsetActiveSub(prevSub);
  }
  return () => effectCleanup(effectNode);
}

export { effect };
