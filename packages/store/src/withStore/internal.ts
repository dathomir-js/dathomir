import type { AtomStore } from "../createAtomStore/implementation";

const storeStack: AtomStore[] = [];

function getCurrentStore(): AtomStore | undefined {
  return storeStack[storeStack.length - 1];
}

function pushCurrentStore(store: AtomStore): void {
  storeStack.push(store);
}

function popCurrentStore(): AtomStore | undefined {
  return storeStack.pop();
}

export { getCurrentStore, popCurrentStore, pushCurrentStore };
