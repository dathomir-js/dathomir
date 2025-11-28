import { mountToNode } from "@/mount";
import type { VNode } from "@/types";

import type { Computed } from "@dathomir/reactivity";

/**
 * Hydrates by clearing the container and mounting a fresh VNode tree.
 * Differential (non-destructive) hydration will be added in a future phase.
 */
const hydrate = (vNode: VNode | Computed<VNode>, container: Element): Node => {
  container.innerHTML = "";
  const node = mountToNode(vNode);
  container.appendChild(node);
  return node;
};

export { hydrate };
