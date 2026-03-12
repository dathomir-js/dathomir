import { atom, createAtomStore } from "@dathomir/core";

type DemoTheme = "light" | "mint" | "amber" | "night";

const countAtom = atom<number>("count", 3);
const themeAtom = atom<DemoTheme>("theme", "light");

function createDemoStore(options: {
	appId: string;
	count?: number;
	theme?: DemoTheme;
}) {
	return createAtomStore({
		appId: options.appId,
		values: [
			[countAtom, options.count ?? 3],
			[themeAtom, options.theme ?? "light"],
		],
	});
}

export { countAtom, createDemoStore, themeAtom };
export type { DemoTheme };

