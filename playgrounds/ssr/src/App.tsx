import { PlaygroundShell } from "./PlaygroundShell";
import { ALSPage } from "./pages/ALSPage";
import { ComponentSSRPage } from "./pages/ComponentSSRPage";
import { OverviewPage } from "./pages/OverviewPage";
import { StoreBoundariesPage } from "./pages/StoreBoundariesPage";
import {
  getPlaygroundRouteOrDefault,
  type PlaygroundRoutePath,
} from "./routes";

function renderPlaygroundPage(props: {
  requestId: string;
  requestStoreAppId: string;
  routePath: PlaygroundRoutePath;
  pagePayloadJson: string;
}) {
  const route = getPlaygroundRouteOrDefault(props.routePath);

  let pageContent: JSX.Element;

  switch (route.path) {
    case "/als":
      pageContent = (
        <ALSPage
          requestStoreAppId={props.requestStoreAppId}
          pagePayloadJson={props.pagePayloadJson}
        />
      );
      break;

    case "/store-boundaries":
      pageContent = <StoreBoundariesPage />;
      break;

    case "/component-ssr":
      pageContent = <ComponentSSRPage />;
      break;

    case "/":
    default:
      pageContent = <OverviewPage />;
      break;
  }

  return (
    <PlaygroundShell
      routePath={route.path}
      requestId={props.requestId}
      renderPage={() => pageContent}
    />
  );
}

export { renderPlaygroundPage };
export default renderPlaygroundPage;
