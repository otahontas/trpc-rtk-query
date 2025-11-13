import { test, expect } from "@playwright/test";

test.describe("tRPC RTK Query - Queries", () => {
  test("should load and display user data", async ({ page }) => {
    await page.goto("/");

    // Wait for app to load
    await expect(page.getByTestId("app-title")).toBeVisible();

    // Check that user data loads
    await expect(page.getByTestId("user-loading")).toBeVisible();
    await expect(page.getByTestId("user-loading")).not.toBeVisible({ timeout: 10000 });

    // Verify user data is displayed
    await expect(page.getByTestId("user-id")).toHaveText("1");
    await expect(page.getByTestId("user-name")).toHaveText("Alice Johnson");
  });

  test("should load different user when ID changes", async ({ page }) => {
    await page.goto("/");

    // Wait for initial load
    await expect(page.getByTestId("user-data")).toBeVisible();

    // Change user ID
    await page.getByTestId("user-id-input").fill("2");

    // Wait for loading state
    await expect(page.getByTestId("user-loading")).toBeVisible();
    await expect(page.getByTestId("user-loading")).not.toBeVisible({ timeout: 10000 });

    // Verify new user data
    await expect(page.getByTestId("user-id")).toHaveText("2");
    await expect(page.getByTestId("user-name")).toHaveText("Bob Smith");
  });

  test("should display error for non-existent user", async ({ page }) => {
    await page.goto("/");

    // Wait for initial load
    await expect(page.getByTestId("user-data")).toBeVisible();

    // Try to load non-existent user
    await page.getByTestId("user-id-input").fill("999");

    // Wait for error state
    await expect(page.getByTestId("user-error")).toBeVisible({ timeout: 10000 });
  });

  test("should load list of all users", async ({ page }) => {
    await page.goto("/");

    // Wait for users list to load
    await expect(page.getByTestId("users-loading")).toBeVisible();
    await expect(page.getByTestId("users-loading")).not.toBeVisible({ timeout: 10000 });

    // Verify users list is displayed
    await expect(page.getByTestId("users-list")).toBeVisible();
    await expect(page.getByTestId("user-item-1")).toContainText("Alice Johnson");
    await expect(page.getByTestId("user-item-2")).toContainText("Bob Smith");
    await expect(page.getByTestId("user-item-3")).toContainText("Charlie Brown");
  });

  test("should handle nested route queries", async ({ page }) => {
    await page.goto("/");

    // Wait for page load
    await expect(page.getByTestId("app-title")).toBeVisible();

    // Check nested message
    await expect(page.getByTestId("nested-message")).toContainText(
      "Hello from nested route",
    );

    // Check deeply nested message
    await expect(page.getByTestId("deep-message")).toContainText(
      "Hello from very nested route",
    );
    await expect(page.getByTestId("deep-message")).toContainText("Level: deep");

    // Check echo message
    await expect(page.getByTestId("echo-message")).toContainText("Echo: Hello E2E");
  });

  test("should load post data from nested router", async ({ page }) => {
    await page.goto("/");

    // Wait for page load
    await expect(page.getByTestId("app-title")).toBeVisible();

    // Verify post data loads
    await expect(page.getByTestId("post-data")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("post-id")).toHaveText("1");
    await expect(page.getByTestId("post-title")).toHaveText("Post 1");
  });
});
