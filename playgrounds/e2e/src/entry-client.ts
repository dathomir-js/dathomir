import { clearGlobalStyles } from "@dathomir/components";
import { hydrateIslands } from "@dathomir/runtime/hydration";

clearGlobalStyles();

void import("./appRoot").then(() => {
  queueMicrotask(() => {
    hydrateIslands(document);
  });
});
