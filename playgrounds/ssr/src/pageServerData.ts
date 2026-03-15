import { withStore } from "@dathomir/core";

import { collectCurrentStoreProbe } from "./alsDiagnostics";
import { createDemoStore } from "./demoStore";
import type { PlaygroundRoutePath } from "./routes";

async function createPagePayload(context: {
  routePath: PlaygroundRoutePath;
  requestId: string;
  requestStore: ReturnType<typeof createDemoStore>;
}): Promise<string> {
  switch (context.routePath) {
    case "/als": {
      const serverProbe = await withStore(context.requestStore, async () =>
        collectCurrentStoreProbe(`page:${context.requestId}`, 12),
      );

      return JSON.stringify(serverProbe);
    }

    default:
      return "";
  }
}

export { createPagePayload };
