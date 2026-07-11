import { test, expect } from "@playwright/test";

test("app loads, registers a service worker, and still renders after going offline", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByTestId("app-shell")).toBeVisible();

  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("app-shell")).toBeVisible();

  await expect(page.locator('[data-testid^="village-node-"]')).toHaveCount(10);
});

test("tapping a village node opens a lesson and Discover shows the symbol offline", async ({ page, context }) => {
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker?.ready.then(() => true));
  await context.setOffline(true);
  await page.reload();

  await page.getByTestId("village-node-letter-A").click();
  await expect(page.getByTestId("discover-symbol")).toHaveText("A");
});
