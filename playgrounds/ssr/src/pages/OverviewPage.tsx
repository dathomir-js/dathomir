import { playgroundRoutes } from "../routes";

function OverviewPage() {
  return (
    <section>
      <h2>Available demos</h2>
      <p>
        Each route isolates one SSR topic so new experiments do not have to grow the
        same page forever.
      </p>

      <div class="route-grid">
        {playgroundRoutes
          .filter((route) => route.path !== "/")
          .map((route) => (
            <article class="route-card">
              <h3>{route.label}</h3>
              <p>{route.description}</p>
              <p>
                Route: <code>{route.path}</code>
              </p>
              <a class="route-link" href={route.path}>
                Open demo
              </a>
            </article>
          ))}
      </div>
    </section>
  );
}

export { OverviewPage };
