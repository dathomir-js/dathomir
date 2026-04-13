import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("hydrates idle, media, and visible strategies", async () => {
  const { page, consoleErrors } = await openPage("/deferred-strategies", {
    viewport: { width: 640, height: 720 },
  });

  await expect
    .poll(async () =>
      (await page.getByTestId("idle-status").textContent())?.trim(),
    )
    .toBe("ready:idle");
  await expect
    .poll(async () =>
      (await page.getByTestId("media-status").textContent())?.trim(),
    )
    .toBe("ready:media");

  await page.getByTestId("visible-status").scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      (await page.getByTestId("visible-status").textContent())?.trim(),
    )
    .toBe("ready:visible");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
