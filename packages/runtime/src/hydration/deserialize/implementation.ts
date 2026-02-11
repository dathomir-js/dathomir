/**
 * State deserialization for Hydration.
 *
 * Per SPEC.typ:
 * - Uses devalue for parsing serialized state
 * - Reads from <script type="application/json" data-dh-state> elements
 */

import { parse } from "devalue";

import type { StateObject } from "@/ssr/serialize/implementation";

/**
 * Deserialize state from a string.
 */
function deserializeState(serialized: string): StateObject {
  return parse(serialized) as StateObject;
}

/**
 * Find and parse state script from a container.
 */
function parseStateScript(container: Element | ShadowRoot): StateObject | null {
  const script = container.querySelector(
    'script[type="application/json"][data-dh-state]',
  );

  if (!script?.textContent) {
    return null;
  }

  try {
    const state = deserializeState(script.textContent);
    // Remove the script after parsing
    script.remove();
    return state;
  } catch (err) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.error(
        `[dathomir] Failed to parse state script. ` +
          `Ensure the serialized state is valid devalue format.`,
        err,
      );
    }
    return null;
  }
}

export { deserializeState, parseStateScript };
