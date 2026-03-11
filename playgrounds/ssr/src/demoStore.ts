import { atom, createAtomStore } from "@dathomir/core";

const countAtom = atom("count", 3);
const appId = "playground-ssr";

function createDemoStore() {
  return createAtomStore({
    appId,
    values: [[countAtom, 3]],
  });
}

export { countAtom, createDemoStore };
