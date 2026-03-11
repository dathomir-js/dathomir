import type { AtomStore } from "@dathomir/store";
import { getCurrentStore } from "@dathomir/store/internal";

const STORE_BINDING = Symbol("dathomir.component.store");

type StoreBoundHost = HTMLElement & {
  [STORE_BINDING]?: AtomStore;
};

function bindStoreToHost(host: HTMLElement, store: AtomStore): void {
  const boundHost = host as StoreBoundHost;
  if (boundHost[STORE_BINDING] === undefined) {
    boundHost[STORE_BINDING] = store;
  }
}

function captureCurrentStore(host: HTMLElement): void {
  const currentStore = getCurrentStore();
  if (currentStore !== undefined) {
    bindStoreToHost(host, currentStore);
  }
}

function getStoreFromHost(host: HTMLElement): AtomStore {
  const store = (host as StoreBoundHost)[STORE_BINDING];
  if (store === undefined) {
    throw new Error("[dathomir] No store bound to component host");
  }
  return store;
}

function peekStoreFromHost(host: HTMLElement): AtomStore | undefined {
  return (host as StoreBoundHost)[STORE_BINDING];
}

function bindCurrentStoreToSubtree(root: Node): void {
  const currentStore = getCurrentStore();
  if (currentStore === undefined) return;

  if (root instanceof HTMLElement) {
    if (root.tagName.includes("-")) {
      bindStoreToHost(root, currentStore);
    }

    const nestedHosts = root.querySelectorAll<HTMLElement>("*");
    for (const element of nestedHosts) {
      if (element.tagName.includes("-")) {
        bindStoreToHost(element, currentStore);
      }
    }
  }

  if (root instanceof DocumentFragment) {
    const nestedHosts = root.querySelectorAll<HTMLElement>("*");
    for (const element of nestedHosts) {
      if (element.tagName.includes("-")) {
        bindStoreToHost(element, currentStore);
      }
    }
  }
}

export {
  bindCurrentStoreToSubtree,
  bindStoreToHost,
  captureCurrentStore,
  getStoreFromHost,
  peekStoreFromHost,
};
