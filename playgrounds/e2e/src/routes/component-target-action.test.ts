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

it("emits component-target click metadata and loads without client errors", async () => {
  const { html } = await fetchHtml("/component-target-action");
  expect(html).toContain("data-dh-client-actions");
  expect(html).toContain('data-dh-island="interaction"');

  const { page, consoleErrors } = await openPage("/component-target-action");

  await expect
    .poll(async () =>
      (await page.getByTestId("component-target-count").textContent())?.trim(),
    )
    .toBe("0");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
