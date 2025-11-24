import { test, expect } from '@playwright/test';

test.describe('User Design Flow - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should complete full design save and load flow', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    // Step 1: Navigate to design page
    await page.goto('/design');
    
    // Wait for page to load
    await expect(page).toHaveTitle(/Bath Fitter/i);

    // Step 2: Select a shower type (if available)
    const showerTypeButton = page.locator('[data-testid="shower-type"]').first();
    if (await showerTypeButton.isVisible()) {
      await showerTypeButton.click();
    }

    // Step 3: Make some design selections
    // (These selectors will need to match your actual UI)
    const wallOption = page.locator('[data-testid="wall-option"]').first();
    if (await wallOption.isVisible()) {
      await wallOption.click();
    }

    // Step 4: Click "Save Design" button
    await page.click('[data-testid="save-design-button"]');

    // Step 5: Fill in save design form
    await page.fill('[data-testid="user-email"]', testEmail);
    await page.fill('[data-testid="user-name"]', 'Test User');
    await page.fill('[data-testid="user-phone"]', '+1234567890');
    await page.fill('[data-testid="user-postal-code"]', '12345');

    // Step 6: Submit the form
    await page.click('[data-testid="submit-save-design"]');

    // Step 7: Wait for success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({
      timeout: 10000,
    });

    // Step 8: Verify success message contains confirmation
    const successText = await page.locator('[data-testid="success-message"]').textContent();
    expect(successText).toContain('saved successfully');

    // Step 9: Now test loading the design
    await page.goto('/');
    await page.click('[data-testid="load-design-button"]');

    // Step 10: Enter email to load designs
    await page.fill('[data-testid="load-email-input"]', testEmail);
    await page.click('[data-testid="search-designs-button"]');

    // Step 11: Wait for designs to load
    await expect(page.locator('[data-testid="design-list"]')).toBeVisible({
      timeout: 10000,
    });

    // Step 12: Verify the saved design appears
    const designItem = page.locator('[data-testid="design-item"]').first();
    await expect(designItem).toBeVisible();

    // Step 13: Click to load the design
    await designItem.click();

    // Step 14: Verify design is loaded (check URL or page state)
    await expect(page).toHaveURL(/design/);
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/design');

    // Click save without making selections
    await page.click('[data-testid="save-design-button"]');

    // Try to submit with invalid email
    await page.fill('[data-testid="user-email"]', 'invalid-email');
    await page.click('[data-testid="submit-save-design"]');

    // Should show validation error
    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
  });

  test('should require email to save design', async ({ page }) => {
    await page.goto('/design');

    await page.click('[data-testid="save-design-button"]');

    // Try to submit without email
    await page.click('[data-testid="submit-save-design"]');

    // Should show required error
    const errorMessage = page.locator('text=Email address is required');
    await expect(errorMessage).toBeVisible();
  });

  test('should show empty state when no designs found', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="load-design-button"]');

    // Search for non-existent email
    await page.fill('[data-testid="load-email-input"]', 'nonexistent@example.com');
    await page.click('[data-testid="search-designs-button"]');

    // Should show empty state
    await expect(page.locator('text=No designs found')).toBeVisible({
      timeout: 10000,
    });
  });
});

test.describe('Design Editor - E2E', () => {
  test('should allow selecting different product options', async ({ page }) => {
    await page.goto('/design');

    // Select category
    await page.click('[data-testid="category-walls"]');

    // Wait for products to load
    await expect(page.locator('[data-testid="product-list"]')).toBeVisible();

    // Select a product
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    await firstProduct.click();

    // Verify product is selected (check for selected state)
    await expect(firstProduct).toHaveClass(/selected/);

    // Select a color variant
    const colorVariant = page.locator('[data-testid="color-variant"]').first();
    await colorVariant.click();

    // Verify variant is selected
    await expect(colorVariant).toHaveClass(/selected/);
  });

  test('should update preview when selections change', async ({ page }) => {
    await page.goto('/design');

    // Get initial preview state
    const preview = page.locator('[data-testid="design-preview"]');
    await expect(preview).toBeVisible();

    // Make a selection
    await page.click('[data-testid="category-walls"]');
    await page.click('[data-testid="product-item"]');

    // Preview should update (check for loading state or image change)
    await expect(preview).toHaveAttribute('data-updated', 'true', {
      timeout: 5000,
    });
  });
});

test.describe('Responsive Design - E2E', () => {
  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/design');

    // Mobile menu should be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // Should be able to navigate
    await mobileMenu.click();
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/design');

    // Content should be visible and properly laid out
    await expect(page.locator('[data-testid="design-container"]')).toBeVisible();
  });
});

test.describe('Performance - E2E', () => {
  test('should load home page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load design page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/design');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
});
