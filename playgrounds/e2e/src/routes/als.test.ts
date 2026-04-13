import { afterAll, beforeAll, expect, it } from "vitest";

import { acquireHarness, openPage, releaseHarness } from "../e2eHarness";

beforeAll(async () => {
  await acquireHarness();
});

afterAll(async () => {
  await releaseHarness();
});

it("runs the AsyncLocalStorage isolation probe successfully", async () => {
  const { page, consoleErrors } = await openPage("/als");

  await expect
    .poll(async () =>
      (await page.getByTestId("server-probe-status").textContent())?.trim(),
    )
    .toBe("stable");

  await page.getByTestId("run-parallel-probe").click();

  await expect
    .poll(async () =>
      (await page.getByTestId("parallel-probe-status").textContent())?.trim(),
    )
    .toBe("done");
  await expect
    .poll(
      async () =>
        (await page.getByTestId("parallel-probe-results").textContent()) ?? "",
    )
    .toContain("Concurrent isolation:passed");
  expect(consoleErrors).toEqual([]);

  await page.close();
});
