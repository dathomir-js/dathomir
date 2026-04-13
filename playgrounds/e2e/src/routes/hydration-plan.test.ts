import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("hydrates the planFactory fixture counter", async () => {
  const { page, consoleErrors } = await openPage("/hydration-plan");

  await page.getByTestId("hydration-increment").click();

  await expect
    .poll(async () =>
      (await page.getByTestId("hydration-status").textContent())?.trim(),
    )
    .toBe("yes");
  await expect
    .poll(async () =>
      (await page.getByTestId("hydration-count").textContent())?.trim(),
    )
    .toBe("1");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
