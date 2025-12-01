import { createUnplugin } from "unplugin";

const unpluginFactory = createUnplugin(() => ({
  name: "dathomir",
  transformInclude: (id: string) => /\.[jt]sx$/.test(id),
  transform: (_code: string) => {
    throw new Error("@dathomir/plugin is under reconstruction for v2.0.0");
  },
}));

export const dathomir = unpluginFactory;
export default dathomir;
