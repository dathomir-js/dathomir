/**
 * Batch implementation - group signal updates into single flush.
 * @module
 */
import { endBatch, startBatch } from "../internal/system";

/**
 * Execute a callback while batching signal notifications into a single flush.
 * @template T
 * @param {() => T} fn Callback to run within the batch.
 * @returns {T} Result of the callback.
 */
function batch<T>(fn: () => T): T {
  startBatch();
  try {
    return fn();
  } finally {
    endBatch();
  }
}

export { batch };
