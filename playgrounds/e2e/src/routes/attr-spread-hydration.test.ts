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

it("hydrates dynamic attrs and spread updates in place", async () => {
  const { html } = await fetchHtml("/attr-spread-hydration");
  expect(html).toContain('class="mode-idle"');
  expect(html).toContain('data-state="idle"');
  expect(html).toContain('title="idle"');
  expect(html).toContain('aria-busy="false"');

  const { page, consoleErrors } = await openPage("/attr-spread-hydration");
  const target = page.getByTestId("attr-spread-target");

  await page.getByTestId("attr-spread-toggle").click();

  await expect
    .poll(async () =>
      (await page.getByTestId("attr-spread-state").textContent())?.trim(),
    )
    .toBe("armed");
  await expect
    .poll(async () => await target.getAttribute("class"))
    .toBe("mode-armed");
  await expect
    .poll(async () => await target.getAttribute("data-state"))
    .toBe("armed");
  await expect
    .poll(async () => await target.getAttribute("title"))
    .toBe("armed");
  await expect
    .poll(async () => await target.getAttribute("aria-busy"))
    .toBe("true");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
