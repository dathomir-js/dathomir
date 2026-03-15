import {
  getPlaygroundRouteOrDefault,
  playgroundRoutes,
  type PlaygroundRoutePath,
} from "./routes";

function PlaygroundShell(props: {
  routePath: PlaygroundRoutePath;
  requestId: string;
  renderPage: () => JSX.Element;
}) {
  const currentRoute = getPlaygroundRouteOrDefault(props.routePath);
  const renderMode = typeof document === "undefined" ? "SSR" : "CSR";

  return (
    <main>
      <header class="page-hero">
        <p class="eyebrow">Dathomir SSR Playground</p>
        <h1>{currentRoute.title}</h1>
        <p>{currentRoute.description}</p>
        <div class="hero-meta">
          <p>
            Render mode: <strong>{renderMode}</strong>
          </p>
          <p>
            Request id: <strong data-testid="request-id">{props.requestId}</strong>
          </p>
        </div>
      </header>

      <nav class="feature-nav" aria-label="SSR playground pages">
        {playgroundRoutes.map((route) => (
          <a
            class={
              route.path === props.routePath
                ? "feature-link is-active"
                : "feature-link"
            }
            href={route.path}
          >
            {route.label}
          </a>
        ))}
      </nav>

      {props.renderPage()}
    </main>
  );
}

export { PlaygroundShell };
