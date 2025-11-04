import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { transform } from "@dathomir/transformer";

export interface Options {}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  _options
) => ({
  name: "@dathomir/plugin",
  enforce: "post",
  transform: {
    filter: {
      id: {
        include: [/\.(t|j)sx$/],
        exclude: [/node_modules/],
      },
    },
    handler(code) {
      const result = transform(code);

      return result.code;
    },
  },
});

export const dathomir = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default dathomir;
