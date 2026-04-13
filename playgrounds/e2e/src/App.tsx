import { ALSRoute } from "./routes/als";
import { AttrSpreadHydrationRoute } from "./routes/attr-spread-hydration";
import { ComponentTargetActionRoute } from "./routes/component-target-action";
import { ComponentTargetKeydownRoute } from "./routes/component-target-keydown";
import { CustomElementFallbackRoute } from "./routes/custom-element-fallback";
import { DeferredStrategiesRoute } from "./routes/deferred-strategies";
import { DispatchBranchRoute } from "./routes/dispatch-branch";
import { EventReplayRoute } from "./routes/event-replay";
import { HomeRoute } from "./routes/home";
import { HydrationPlanRoute } from "./routes/hydration-plan";
import { InteractionReplayRoute } from "./routes/interaction-replay";
import { MarkerUpdatesRoute } from "./routes/marker-updates";
import { MismatchFallbackRoute } from "./routes/mismatch-fallback";
import { NestedBoundaryRoute } from "./routes/nested-boundary";
import { StoreSnapshotRoundtripRoute } from "./routes/store-snapshot-roundtrip";
import type { FixtureRoutePath } from "./routes";

function App(props: {
  routePath: FixtureRoutePath;
  requestStoreAppId: string;
  pagePayloadJson: string;
}) {
  if (props.routePath === "/interaction-replay") {
    return <InteractionReplayRoute />;
  }

  if (props.routePath === "/hydration-plan") {
    return <HydrationPlanRoute />;
  }

  if (props.routePath === "/nested-boundary") {
    return <NestedBoundaryRoute />;
  }

  if (props.routePath === "/component-target-action") {
    return <ComponentTargetActionRoute />;
  }

  if (props.routePath === "/component-target-keydown") {
    return <ComponentTargetKeydownRoute />;
  }

  if (props.routePath === "/attr-spread-hydration") {
    return <AttrSpreadHydrationRoute />;
  }

  if (props.routePath === "/marker-updates") {
    return <MarkerUpdatesRoute />;
  }

  if (props.routePath === "/event-replay") {
    return <EventReplayRoute />;
  }

  if (props.routePath === "/deferred-strategies") {
    return <DeferredStrategiesRoute />;
  }

  if (props.routePath === "/dispatch-branch") {
    return <DispatchBranchRoute />;
  }

  if (props.routePath === "/custom-element-fallback") {
    return <CustomElementFallbackRoute />;
  }

  if (props.routePath === "/store-snapshot-roundtrip") {
    return <StoreSnapshotRoundtripRoute />;
  }

  if (props.routePath === "/mismatch-fallback") {
    return <MismatchFallbackRoute />;
  }

  if (props.routePath === "/als") {
    return (
      <ALSRoute
        requestStoreAppId={props.requestStoreAppId}
        pagePayloadJson={props.pagePayloadJson}
      />
    );
  }

  return <HomeRoute />;
}

export { App };
