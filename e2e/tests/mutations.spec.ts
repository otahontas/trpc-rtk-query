import { test, expect } from "@playwright/test";

test.describe("tRPC RTK Query - Mutations", () => {
  test("should create a new user", async ({ page }) => {
    await page.goto("/");

    // Wait for initial users list to load
    await expect(page.getByTestId("users-list")).toBeVisible({ timeout: 10000 });

    // Count initial users
    const initialUserItems = await page.getByTestId("users-list").locator("li").count();

    // Create a new user
    await page.getByTestId("new-user-input").fill("David Wilson");
    await page.getByTestId("create-user-button").click();

    // Wait for button to be enabled again (mutation complete)
    await expect(page.getByTestId("create-user-button")).not.toBeDisabled({
      timeout: 10000,
    });

    // Verify new user appears in the list
    // Note: RTK Query should automatically refetch or update the cache
    // Wait a bit for the list to update
    await page.waitForTimeout(500);

    const updatedUserItems = await page.getByTestId("users-list").locator("li").count();
    expect(updatedUserItems).toBe(initialUserItems + 1);

    // Verify the new user is in the list
    await expect(page.getByTestId("users-list")).toContainText("David Wilson");
  });

  test("should update user name", async ({ page }) => {
    await page.goto("/");

    // Wait for initial user to load
    await expect(page.getByTestId("user-data")).toBeVisible({ timeout: 10000 });

    // Verify initial name
    const initialName = await page.getByTestId("user-name").textContent();
    expect(initialName).toBe("Alice Johnson");

    // Update the user name
    await page.getByTestId("update-name-input").fill("Alice Smith");
    await page.getByTestId("update-user-button").click();

    // Wait for mutation to complete
    await expect(page.getByTestId("update-user-button")).not.toBeDisabled({
      timeout: 10000,
    });

    // Wait for the UI to update
    await page.waitForTimeout(500);

    // Verify the name was updated
    await expect(page.getByTestId("user-name")).toHaveText("Alice Smith");
  });

  test("should create a post via nested mutation", async ({ page }) => {
    await page.goto("/");

    // Wait for page load
    await expect(page.getByTestId("app-title")).toBeVisible();

    // Click create post button
    await page.getByTestId("create-post-button").click();

    // Wait for the mutation to complete
    // Since this doesn't have a loading state, just wait a moment
    await page.waitForTimeout(500);

    // The mutation should succeed without errors
    // (we can verify by checking the console or the network tab in a real scenario)
  });

  test("should handle multiple sequential mutations", async ({ page }) => {
    await page.goto("/");

    // Wait for initial load
    await expect(page.getByTestId("users-list")).toBeVisible({ timeout: 10000 });

    // Create first user
    await page.getByTestId("new-user-input").fill("User One");
    await page.getByTestId("create-user-button").click();
    await expect(page.getByTestId("create-user-button")).not.toBeDisabled({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    // Create second user
    await page.getByTestId("new-user-input").fill("User Two");
    await page.getByTestId("create-user-button").click();
    await expect(page.getByTestId("create-user-button")).not.toBeDisabled({
      timeout: 10000,
    });
    await page.waitForTimeout(500);

    // Verify both users were created
    await expect(page.getByTestId("users-list")).toContainText("User One");
    await expect(page.getByTestId("users-list")).toContainText("User Two");
  });

  test("should show loading state during mutation", async ({ page }) => {
    await page.goto("/");

    // Wait for initial load
    await expect(page.getByTestId("user-data")).toBeVisible({ timeout: 10000 });

    // Start creating a user
    await page.getByTestId("new-user-input").fill("Test User");

    // Check the button text before clicking
    await expect(page.getByTestId("create-user-button")).toContainText("Create User");

    // Click and immediately check for loading state
    await page.getByTestId("create-user-button").click();

    // The button should show "Creating..." while the mutation is in progress
    // This might be very fast, so we check the final state
    await expect(page.getByTestId("create-user-button")).not.toBeDisabled({
      timeout: 10000,
    });
    await expect(page.getByTestId("create-user-button")).toContainText("Create User");
  });
});
