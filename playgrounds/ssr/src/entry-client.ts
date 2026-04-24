import { clearGlobalStyles } from "@dathra/components";
import { bindStoreToHost } from "@dathra/components/internal";
import { hydrateIslands } from "@dathra/runtime/hydration";

import { createDemoStore } from "./demoStore";

function bindPlaygroundRootStore(): void {
  const rootHost = document.querySelector("playground-ssr-app");
  if (!(rootHost instanceof HTMLElement)) {
    return;
  }

  const appId =
    rootHost.getAttribute("requeststoreappid") ?? "playground-ssr-root";
  bindStoreToHost(
    rootHost,
    createDemoStore({
      appId,
    }),
  );
}

clearGlobalStyles();
bindPlaygroundRootStore();

void import("./SSRAppRoot").then(() => {
  queueMicrotask(() => {
    hydrateIslands(document);
  });
});
