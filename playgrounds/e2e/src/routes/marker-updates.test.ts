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

it("hydrates text, insert, and each marker updates", async () => {
  const { html } = await fetchHtml("/marker-updates");
  expect(html).toContain("<!--dh:t:");
  expect(html).toContain("<!--dh:i:");
  expect(html).toContain("<!--dh:b:");

  const { page, consoleErrors } = await openPage("/marker-updates");

  await page.getByTestId("marker-update-name").click();
  await expect
    .poll(async () =>
      (await page.getByTestId("marker-text").textContent())?.trim(),
    )
    .toContain("beta");

  await page.getByTestId("marker-toggle-note").click();
  await expect
    .poll(async () => await page.getByTestId("marker-note").textContent())
    .toBe("Inserted note is visible.");

  await page.getByTestId("marker-add-item").click();
  await expect
    .poll(
      async () => await page.getByTestId("marker-list").locator("li").count(),
    )
    .toBe(3);
  expect(consoleErrors).toEqual([]);

  await page.close();
});
