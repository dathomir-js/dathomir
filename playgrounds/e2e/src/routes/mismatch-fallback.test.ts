import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("recovers from a hydration mismatch with a client fallback UI", async () => {
  const { page, consoleErrors } = await openPage("/mismatch-fallback");

  await expect
    .poll(async () =>
      (await page.getByTestId("mismatch-status").textContent())?.trim(),
    )
    .toBe("recovered");

  await page.getByTestId("mismatch-retry").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("mismatch-count").textContent())?.trim(),
    )
    .toBe("1");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
