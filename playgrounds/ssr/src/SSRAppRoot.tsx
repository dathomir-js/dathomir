import { defineComponent } from "@dathomir/components";

import { withStore } from "@dathomir/core";
import { App } from "./App";
import { createDemoStore } from "./demoStore";

export const SSRAppRoot = defineComponent(
  "playground-ssr-app",
  () => {
    const store = createDemoStore({
      appId: "playground-ssr-root",
      count: 3,
      theme: "light",
    });

    return withStore(store, () => <App />);
  },
);
