import { afterAll, beforeAll, expect, it } from "vitest";

import {
  acquireHarness,
  fetchHtml,
  openPage,
  releaseHarness,
} from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("hydrates from the serialized store snapshot and preserves the server value", async () => {
  const { html } = await fetchHtml("/store-snapshot-roundtrip");
  expect(html).toContain("data-dh-store");
  expect(html).toContain("snapshot-midnight");

  const { page, consoleErrors } = await openPage("/store-snapshot-roundtrip");

  await expect
    .poll(async () =>
      (await page.getByTestId("snapshot-theme").textContent())?.replaceAll(
        " ",
        "",
      ),
    )
    .toBe("Theme:snapshot-midnight");
  await expect
    .poll(async () =>
      (await page.getByTestId("snapshot-count").textContent())?.replaceAll(
        " ",
        "",
      ),
    )
    .toBe("Count:7");

  await page.getByTestId("snapshot-increment").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("snapshot-count").textContent())?.replaceAll(
        " ",
        "",
      ),
    )
    .toBe("Count:8");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
