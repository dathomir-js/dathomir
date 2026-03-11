import type { AtomStore } from "../createAtomStore/implementation";
import {
  getCurrentStore as readCurrentStore,
  popCurrentStore,
  pushCurrentStore,
} from "./internal";

function getCurrentStore(): AtomStore | undefined {
  return readCurrentStore();
}

function withStore<T>(store: AtomStore, render: () => T): T {
  pushCurrentStore(store);
  let result: T;

  try {
    result = render();
  } catch (error) {
    const currentStore = popCurrentStore();
    if (currentStore !== store) {
      throw new AggregateError([error], "Store boundary stack is corrupted");
    }
    throw error;
  }

  const currentStore = popCurrentStore();
  if (currentStore !== store) {
    throw new Error("Store boundary stack is corrupted");
  }

  return result;
}

export { getCurrentStore, withStore };
