import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("keeps nested child hydration intact after outer updates", async () => {
  const { page, consoleErrors } = await openPage("/nested-boundary");

  await page.getByTestId("nested-inner-button").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("nested-inner-count").textContent())?.trim(),
    )
    .toBe("1");

  await page.getByTestId("nested-outer-button").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("nested-outer-count").textContent())?.trim(),
    )
    .toBe("1");

  await page.getByTestId("nested-inner-button").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("nested-inner-count").textContent())?.trim(),
    )
    .toBe("2");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
