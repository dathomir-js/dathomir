import { defineComponent } from "@dathomir/components";

import { getCurrentStore, withStore } from "@dathomir/core";
import { renderPlaygroundPage } from "./App";
import { createDemoStore } from "./demoStore";
import type { PlaygroundRoutePath } from "./routes";

export const SSRAppRoot = defineComponent(
  "playground-ssr-app",
  ({ props }) => {
    const inheritedStore = getCurrentStore();
    const store = inheritedStore ?? createDemoStore({
      appId: props.requestStoreAppId.value,
      count: 3,
      theme: "light",
    });

    return withStore(store, () =>
      renderPlaygroundPage({
        requestId: props.requestId.value,
        requestStoreAppId: props.requestStoreAppId.value,
        routePath: props.routePath.value as PlaygroundRoutePath,
        pagePayloadJson: props.pagePayloadJson.value,
      }),
    );
  },
  {
    props: {
      requestId: { type: String, default: "client-hydration" },
      requestStoreAppId: {
        type: String,
        default: "playground-ssr-root",
      },
      routePath: { type: String, default: "/" },
      pagePayloadJson: { type: String, default: "" },
    },
  },
);
