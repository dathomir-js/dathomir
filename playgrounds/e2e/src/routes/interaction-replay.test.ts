import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("hydrates the interaction replay fixture and replays the first click", async () => {
  const { page, consoleErrors } = await openPage("/interaction-replay");

  await page.getByTestId("interaction-trigger").click();

  await expect
    .poll(async () =>
      (await page.getByTestId("interaction-strategy").textContent())?.trim(),
    )
    .toBe("interaction");
  await expect
    .poll(async () =>
      (await page.getByTestId("interaction-count").textContent())?.trim(),
    )
    .toBe("1");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
