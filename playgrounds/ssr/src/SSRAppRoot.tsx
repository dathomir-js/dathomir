import { defineComponent } from "@dathomir/components";

import { App } from "./App";

export const SSRAppRoot = defineComponent(
  "playground-ssr-app",
  () => App(),
);
