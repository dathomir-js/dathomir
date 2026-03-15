import { clearGlobalStyles } from "@dathomir/components";
import { renderDSD } from "@dathomir/components/ssr";

import { SSRAppRoot } from "./SSRAppRoot";
import { createDemoStore } from "./demoStore";
import { createPagePayload } from "./pageServerData";
import {
  getPlaygroundRouteOrDefault,
  type PlaygroundRoutePath,
} from "./routes";

type SSRRenderContext = {
  requestId?: string;
  routePath?: string;
};

/**
 * Render the application to HTML string for SSR.
 */
export async function render(context: SSRRenderContext = {}): Promise<string> {
  clearGlobalStyles();

  const requestId = context.requestId ?? "page-request";
  const routePath = getPlaygroundRouteOrDefault(context.routePath ?? "/")
    .path as PlaygroundRoutePath;
  const requestStore = createDemoStore({
    appId: `playground-ssr-${routePath === "/" ? "overview" : routePath.slice(1)}-${requestId}`,
    count: 3,
    theme: "light",
  });
  const pagePayloadJson = await createPagePayload({
    routePath,
    requestId,
    requestStore,
  });

  try {
    return renderDSD(
      SSRAppRoot,
      {
        requestId,
        requestStoreAppId: requestStore.appId,
        routePath,
        pagePayloadJson,
      },
      { store: requestStore },
    );
  } finally {
    clearGlobalStyles();
  }
}

export { render as default };
