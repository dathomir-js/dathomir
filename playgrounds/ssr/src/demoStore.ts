import { atom, createAtomStore } from "@dathomir/core";

const countAtom = atom("count", 3);

function createDemoStore(appId: string) {
  return createAtomStore({
    appId,
    values: [[countAtom, 3]],
  });
}

export { countAtom, createDemoStore };
