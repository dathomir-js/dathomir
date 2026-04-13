import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("replays focus and pointerdown interaction events", async () => {
  const { page, consoleErrors } = await openPage("/event-replay");

  await page.getByTestId("focus-trigger").focus();
  await expect
    .poll(async () =>
      (await page.getByTestId("focus-count").textContent())?.trim(),
    )
    .toBe("1");
  await expect
    .poll(async () =>
      (await page.getByTestId("focus-strategy").textContent())?.trim(),
    )
    .toBe("interaction");

  await page.getByTestId("pointer-trigger").dispatchEvent("pointerdown", {
    pointerType: "mouse",
    bubbles: true,
  });
  await expect
    .poll(async () =>
      (await page.getByTestId("pointer-count").textContent())?.trim(),
    )
    .toBe("1");
  await expect
    .poll(async () =>
      (await page.getByTestId("pointer-type").textContent())?.trim(),
    )
    .toBe("mouse");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
