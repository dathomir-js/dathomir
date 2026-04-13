import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("replays the first component-target keydown onto the child input", async () => {
  const { page, consoleErrors } = await openPage("/component-target-keydown");

  await page.getByTestId("component-target-key-input").press("Enter");

  await expect
    .poll(async () =>
      (
        await page.getByTestId("component-target-key-count").textContent()
      )?.trim(),
    )
    .toBe("1");
  await expect
    .poll(async () =>
      (
        await page.getByTestId("component-target-last-key").textContent()
      )?.trim(),
    )
    .toBe("Enter");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
