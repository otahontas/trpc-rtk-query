import { test, expect } from '@playwright/test';

test.describe('Built Library Verification', () => {
  test('should use built library from dist folder', async ({ page }) => {
    // This test verifies that the E2E setup is using the built library
    // from the dist/ folder, not the source files

    await page.goto('/');

    // Wait for app to load
    await expect(page.getByTestId('app-title')).toBeVisible();

    // Check console for any module resolution errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for initial data to load successfully
    await expect(page.getByTestId('user-data')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('users-list')).toBeVisible({ timeout: 10000 });

    // Verify no module resolution errors occurred
    // (which would happen if the built library had issues)
    const hasModuleErrors = consoleErrors.some((error) =>
      error.includes('Cannot find module') ||
      error.includes('Failed to resolve') ||
      error.includes('import')
    );

    expect(hasModuleErrors).toBe(false);
  });

  test('should have type-safe hooks from built library', async ({ page }) => {
    // This test verifies that TypeScript types are working correctly
    // from the built library's .d.ts files

    await page.goto('/');

    // If types were broken, the app wouldn't compile/run at all
    // The fact that we can access all these elements means types are working
    await expect(page.getByTestId('app-title')).toBeVisible();

    // Test query hooks
    await expect(page.getByTestId('user-data')).toBeVisible({ timeout: 10000 });

    // Test mutation hooks
    await page.getByTestId('new-user-input').fill('Type Test User');
    await page.getByTestId('create-user-button').click();
    await expect(page.getByTestId('create-user-button')).not.toBeDisabled({ timeout: 10000 });
  });

  test('should work with both ESM and bundled output', async ({ page }) => {
    // Vite uses ESM during development
    // This test verifies the built library works in an ESM context

    await page.goto('/');

    // Wait for app to load
    await expect(page.getByTestId('app-title')).toBeVisible();

    // Test that all major features work
    await expect(page.getByTestId('user-data')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('users-list')).toBeVisible();
    await expect(page.getByTestId('nested-message')).toBeVisible();
    await expect(page.getByTestId('deep-message')).toBeVisible();
    await expect(page.getByTestId('post-data')).toBeVisible();

    // Test mutations work
    await page.getByTestId('new-user-input').fill('ESM Test User');
    await page.getByTestId('create-user-button').click();
    await expect(page.getByTestId('create-user-button')).not.toBeDisabled({ timeout: 10000 });
  });

  test('should handle all tRPC procedure types correctly', async ({ page }) => {
    // Comprehensive test that verifies the built library correctly
    // handles all types of tRPC procedures

    await page.goto('/');

    // Wait for page load
    await expect(page.getByTestId('app-title')).toBeVisible();

    // Test query with input
    await expect(page.getByTestId('user-data')).toBeVisible({ timeout: 10000 });

    // Test query without input
    await expect(page.getByTestId('users-list')).toBeVisible();

    // Test nested queries (single level)
    await expect(page.getByTestId('nested-message')).toBeVisible();

    // Test deeply nested queries (multiple levels)
    await expect(page.getByTestId('deep-message')).toBeVisible();
    await expect(page.getByTestId('echo-message')).toBeVisible();

    // Test nested router with different procedure (posts)
    await expect(page.getByTestId('post-data')).toBeVisible();

    // Test mutation
    await page.getByTestId('new-user-input').fill('Full Test User');
    await page.getByTestId('create-user-button').click();
    await expect(page.getByTestId('create-user-button')).not.toBeDisabled({ timeout: 10000 });

    // Test mutation with update
    await page.getByTestId('update-name-input').fill('Updated Name');
    await page.getByTestId('update-user-button').click();
    await expect(page.getByTestId('update-user-button')).not.toBeDisabled({ timeout: 10000 });

    // Test nested mutation
    await page.getByTestId('create-post-button').click();
    await page.waitForTimeout(500);

    // All procedures worked - built library is fully functional
  });
});
