const routes = [
  "/",
  "/interaction-replay",
  "/als",
  "/hydration-plan",
  "/nested-boundary",
  "/component-target-action",
  "/attr-spread-hydration",
  "/marker-updates",
  "/deferred-strategies",
  "/component-target-keydown",
  "/dispatch-branch",
  "/custom-element-fallback",
  "/event-replay",
  "/store-snapshot-roundtrip",
  "/mismatch-fallback",
] as const;

type FixtureRoutePath = (typeof routes)[number];

function normalizeRoute(pathname: string): string {
  if (pathname === "/index.html") {
    return "/";
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

function resolveRoute(pathname: string): FixtureRoutePath {
  const normalized = normalizeRoute(pathname);
  return routes.includes(normalized as FixtureRoutePath)
    ? (normalized as FixtureRoutePath)
    : "/";
}

export { normalizeRoute, resolveRoute, routes };
export type { FixtureRoutePath };
