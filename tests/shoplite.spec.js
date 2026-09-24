// shoplite.spec.js
// Automated version of your TC-01 through TC-12 for ShopLite.
// Several are EXPECTED TO FAIL right now — they assert the CORRECT/spec
// behavior, and the app currently has bugs.
// Run with: npx playwright test

const { test, expect } = require('@playwright/test');
const path = require('path');

const APP_URL = 'file://' + path.join(__dirname, '..', 'shoplite-app.html');

// Product indices (matching the products array in the app):
// 0 = Wireless Mouse ($25, stock 5)
// 1 = Mechanical Keyboard ($75, stock 3)
// 2 = USB-C Hub ($40, stock 0)

async function setQtyAndAdd(page, productIndex, qty) {
  await page.fill('#qty-' + productIndex, String(qty));
  await page.click('.product:nth-child(' + (productIndex + 1) + ') .addBtn');
}

test.beforeEach(async ({ page }) => {
  await page.goto(APP_URL);
});

// TC-01: valid add within stock
test('TC-01: valid quantity within stock is added correctly', async ({ page }) => {
  await setQtyAndAdd(page, 0, 2); // Wireless Mouse x2 = $50.00
  await expect(page.locator('#cartItems')).toContainText('Wireless Mouse');
  await expect(page.locator('#subtotal')).toHaveText('$50.00');
  await expect(page.locator('#total')).toHaveText('$50.00');
});

// TC-02: quantity exceeding stock rejected
test('TC-02: quantity exceeding stock is rejected', async ({ page }) => {
  await setQtyAndAdd(page, 1, 10); // Keyboard, stock 3, asking for 10
  await expect(page.locator('#cartItems')).not.toContainText('Mechanical Keyboard');
});

// TC-03: negative quantity rejected
test('TC-03: negative quantity is rejected', async ({ page }) => {
  await setQtyAndAdd(page, 0, -2);
  await expect(page.locator('#cartItems')).not.toContainText('Wireless Mouse');
  await expect(page.locator('#total')).not.toContainText('-');
});

// TC-04: decimal quantity rejected
test('TC-04: decimal quantity is rejected, not silently truncated', async ({ page }) => {
  await setQtyAndAdd(page, 0, 1.5);
  await expect(page.locator('#cartItems')).not.toContainText('Wireless Mouse');
});

// TC-05: non-numeric quantity rejected, no NaN
test('TC-05: non-numeric quantity is rejected, does not corrupt totals', async ({ page }) => {
  await setQtyAndAdd(page, 0, 'abc');
  await expect(page.locator('#cartItems')).not.toContainText('NaN');
  await expect(page.locator('#subtotal')).not.toContainText('NaN');
  await expect(page.locator('#total')).not.toContainText('NaN');
});

// TC-06: out-of-stock product cannot be added
test('TC-06: out-of-stock product cannot be added to cart', async ({ page }) => {
  const addBtn = page.locator('.product', { hasText: 'USB-C Hub' }).locator('.addBtn');
  await expect(addBtn).toBeDisabled();
  await expect(page.locator('#cartItems')).not.toContainText('USB-C Hub');
});

// TC-07: adding same product twice merges into one line
test('TC-07: adding the same product twice merges quantities', async ({ page }) => {
  await setQtyAndAdd(page, 0, 1);
  await setQtyAndAdd(page, 0, 2);
  const mouseLines = page.locator('#cartItems .cartItem', { hasText: 'Wireless Mouse' });
  await expect(mouseLines).toHaveCount(1);
  await expect(mouseLines).toContainText('× 3');
});

// TC-08: discount code is case-insensitive
test('TC-08: discount code works regardless of casing', async ({ page }) => {
  await setQtyAndAdd(page, 0, 1); // $25 subtotal
  await page.fill('#discountCode', 'save10');
  await page.click('.discountRow button');
  await expect(page.locator('#total')).toHaveText('$22.50');
});

// TC-09: discount applies only once, even on repeated clicks
test('TC-09: discount does not compound on repeated Apply clicks', async ({ page }) => {
  await setQtyAndAdd(page, 1, 1); // Keyboard $75
  await setQtyAndAdd(page, 0, 1); // Mouse $25 -> subtotal $100
  await page.fill('#discountCode', 'SAVE10');
  const applyBtn = page.locator('.discountRow button');
  await applyBtn.click();
  await applyBtn.click();
  await applyBtn.click();
  await expect(page.locator('#total')).toHaveText('$90.00');
});

// TC-10: removing an item updates subtotal/total correctly
test('TC-10: removing an item updates subtotal and total', async ({ page }) => {
  await setQtyAndAdd(page, 0, 1); // Mouse $25
  await setQtyAndAdd(page, 1, 1); // Keyboard $75 -> subtotal $100
  await expect(page.locator('#subtotal')).toHaveText('$100.00');
  await page.locator('#cartItems .cartItem', { hasText: 'Wireless Mouse' }).locator('.removeBtn').click();
  await expect(page.locator('#subtotal')).toHaveText('$75.00');
  await expect(page.locator('#total')).toHaveText('$75.00');
});

// TC-11: checkout blocked when cart is empty
test('TC-11: checkout is blocked when cart is empty', async ({ page }) => {
  await page.click('.checkoutBtn');
  await expect(page.locator('#msg')).not.toHaveText(/Order placed successfully/);
});

// TC-12: total never goes negative or NaN, even with bad input mixed with valid input
test('TC-12: total is never negative or NaN when invalid input is attempted', async ({ page }) => {
  await setQtyAndAdd(page, 0, -3);
  await setQtyAndAdd(page, 1, 1);
  await expect(page.locator('#total')).not.toContainText('-');
  await expect(page.locator('#total')).not.toContainText('NaN');
});
