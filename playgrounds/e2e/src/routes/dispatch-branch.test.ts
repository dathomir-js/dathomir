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

it("selects the initial dispatch branch in SSR output", async () => {
  const { html } = await fetchHtml("/dispatch-branch");
  expect(html).toContain("Primary branch");
  expect(html).not.toContain("Secondary branch");

  const { page, consoleErrors } = await openPage("/dispatch-branch");
  await expect
    .poll(async () =>
      (await page.getByTestId("dispatch-heading").textContent())?.trim(),
    )
    .toBe("Primary branch");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
