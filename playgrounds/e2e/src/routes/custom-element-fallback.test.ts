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

it("server-renders custom elements and keeps sibling hydration working", async () => {
  const { html } = await fetchHtml("/custom-element-fallback");
  expect(html).toContain("<demo-counter-box");
  expect(html).toContain("Fallback count");
  expect(html).toContain("<!--dh:t:");

  const { page, consoleErrors } = await openPage("/custom-element-fallback");

  await page.getByTestId("custom-element-increment").click();

  await expect
    .poll(async () =>
      (await page.getByTestId("custom-element-label").textContent())?.trim(),
    )
    .toBe("Fallback count1");
  await expect
    .poll(
      async () =>
        await page
          .getByTestId("custom-element-host")
          .getAttribute("data-count"),
    )
    .toBe("1");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
