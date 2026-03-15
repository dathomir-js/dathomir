const playgroundRoutes = [
  {
    path: "/",
    label: "Overview",
    title: "SSR Playground Overview",
    description:
      "Browse focused Dathomir SSR demos by feature instead of stacking every experiment onto one page.",
  },
  {
    path: "/als",
    label: "AsyncLocalStorage",
    title: "AsyncLocalStorage Request Isolation",
    description:
      "Shows request-scoped store propagation across async boundaries and isolation across concurrent SSR work.",
  },
  {
    path: "/store-boundaries",
    label: "Store Boundaries",
    title: "withStore Boundary Behavior",
    description:
      "Shows how sibling subtrees can share a store or split into isolated store boundaries.",
  },
  {
    path: "/component-ssr",
    label: "Component SSR",
    title: "Component SSR and DSD Output",
    description:
      "Shows defineComponent SSR, shared store usage inside a custom element, and raw DSD markup output.",
  },
] as const;

type PlaygroundRoute = (typeof playgroundRoutes)[number];
type PlaygroundRoutePath = PlaygroundRoute["path"];

function normalizePlaygroundPath(pathname: string): string {
  if (pathname === "/index.html") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function getPlaygroundRoute(pathname: string): PlaygroundRoute | undefined {
  const normalized = normalizePlaygroundPath(pathname);

  return playgroundRoutes.find((route) => route.path === normalized);
}

function getPlaygroundRouteOrDefault(pathname: string): PlaygroundRoute {
  return getPlaygroundRoute(pathname) ?? playgroundRoutes[0];
}

export {
  getPlaygroundRoute,
  getPlaygroundRouteOrDefault,
  normalizePlaygroundPath,
  playgroundRoutes,
};
export type { PlaygroundRoute, PlaygroundRoutePath };
