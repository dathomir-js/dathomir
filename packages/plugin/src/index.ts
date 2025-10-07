import type { UnpluginFactory } from "unplugin";
import { createUnplugin } from "unplugin";
import { transform } from "@ailuros/transformer";

export interface Options {}

export const unpluginFactory: UnpluginFactory<Options | undefined> = (
  _options
) => ({
  name: "@ailuros/plugin",
  enforce: "pre",
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

export const ailuros = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default ailuros;
