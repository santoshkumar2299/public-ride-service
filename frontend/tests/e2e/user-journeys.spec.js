// 🧪 User Journey E2E Tests
// Comprehensive testing of user scenarios with real transport data

import { test, expect } from '@playwright/test';

// Test data helper
const testUsers = {
  maya: {
    username: 'commuter_maya',
    password: 'test123',
    profile: 'wheelchair user, daily commuter'
  },
  alex: {
    username: 'student_alex', 
    password: 'test123',
    profile: 'budget-conscious student'
  },
  raj: {
    username: 'senior_raj',
    password: 'test123', 
    profile: 'senior citizen, accessibility needs'
  },
  priya: {
    username: 'tech_priya',
    password: 'test123',
    profile: 'tech professional, speed focused'
  }
};

// Location helpers
const locations = {
  koramangala: { latitude: 12.9352, longitude: 77.6192, name: 'Koramangala 5th Block' },
  mgRoad: { latitude: 12.9759, longitude: 77.6055, name: 'MG Road Metro Station' },
  electronicCity: { latitude: 12.8456, longitude: 77.6603, name: 'Electronic City Phase 1' },
  whitefield: { latitude: 12.9891, longitude: 77.7417, name: 'Whitefield ITPL' }
};

test.describe('User Authentication & Profile', () => {
  test('Maya can login and access her profile', async ({ page }) => {
    await page.goto('/');
    
    // Should show login form for unauthenticated user
    await expect(page.locator('text=Ride Share MVP')).toBeVisible();
    
    // Login as Maya
    await page.fill('input[type="text"]', testUsers.maya.username);
    await page.fill('input[type="password"]', testUsers.maya.password);
    await page.click('button[type="submit"]');
    
    // Should redirect to main map view
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Access profile through user menu
    await page.click('.user-btn');
    await expect(page.locator('.user-dropdown')).toBeVisible();
    await page.click('text=Profile');
    
    // Verify profile page shows user data
    await expect(page.locator('text=commuter_maya')).toBeVisible();
    await expect(page.locator('text=Member since')).toBeVisible();
    
    // Check for accessibility preferences
    await page.click('text=Preferences');
    await expect(page.locator('text=Wheelchair Access')).toBeVisible();
  });

  test('Profile button shows correct user stats', async ({ page }) => {
    await page.goto('/');
    
    // Login as Alex (student)
    await page.fill('input[type="text"]', testUsers.alex.username);
    await page.fill('input[type="password"]', testUsers.alex.password);
    await page.click('button[type="submit"]');
    
    // Navigate to profile
    await page.click('.user-btn');
    await page.click('text=Profile');
    
    // Should show empty stats for new user (as confirmed working)
    await expect(page.locator('text=0').first()).toBeVisible(); // Rides offered
    await expect(page.locator('text=student_alex')).toBeVisible();
  });
});

test.describe('Map Interaction & Location', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant location permissions and set location
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.koramangala);
    
    // Login as Maya for map tests
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.maya.username);
    await page.fill('input[type="password"]', testUsers.maya.password);
    await page.click('button[type="submit"]');
  });

  test('Map loads with correct location status', async ({ page }) => {
    // Verify map is visible
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Check location status card
    await expect(page.locator('.status-card')).toBeVisible();
    await expect(page.locator('text=Exploring')).toBeVisible();
    
    // Verify transport stats are shown
    await expect(page.locator('.transport-stats')).toBeVisible();
    await expect(page.locator('.stat-icon')).toBeVisible();
  });

  test('Pin interaction opens context menu', async ({ page }) => {
    // Wait for map to load
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Click on map to create pin (using coordinate click)
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    
    // Should show pin context menu
    await expect(page.locator('.pin-context-menu')).toBeVisible();
    await expect(page.locator('text=Find Transport')).toBeVisible();
    await expect(page.locator('text=Search & Travel')).toBeVisible();
  });

  test('Search & Travel modal functionality', async ({ page }) => {
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Create pin and open Search & Travel
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    await page.click('text=Search & Travel');
    
    // Verify Quick Travel modal opens
    await expect(page.locator('.quick-travel-modal')).toBeVisible();
    await expect(page.locator('text=Quick location search')).toBeVisible();
    
    // Test location search
    await page.fill('input[placeholder*="Search"]', 'MG Road');
    await expect(page.locator('.search-suggestions')).toBeVisible();
    
    // ESC key should close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('.quick-travel-modal')).not.toBeVisible();
  });
});

test.describe('Transport Scenarios', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.koramangala);
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.maya.username);
    await page.fill('input[type="password"]', testUsers.maya.password);
    await page.click('button[type="submit"]');
  });

  test('Maya finds accessible transport options', async ({ page }) => {
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Create pin and find transport
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    await page.click('text=Find Transport');
    
    // Should open transport options modal
    await expect(page.locator('.community-transport-modal, .ride-booking-modal')).toBeVisible();
    
    // Look for accessibility features in transport options
    // This tests the integration with user preferences
    await expect(page.locator('text=Wheelchair').or(page.locator('text=Accessible'))).toBeVisible();
  });

  test('Emergency transport flow', async ({ page }) => {
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Look for FAB (Floating Action Button)
    await expect(page.locator('.intent-action-buttons, .contextual-fab-container')).toBeVisible();
    
    // Click main FAB to expand
    await page.click('.main-fab');
    
    // Should show emergency transport option
    await expect(page.locator('text=Emergency').or(page.locator('text=Urgent'))).toBeVisible();
  });
});

test.describe('Community Features', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.koramangala);
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.alex.username);
    await page.fill('input[type="password"]', testUsers.alex.password);
    await page.click('button[type="submit"]');
  });

  test('Bus spot reporting workflow', async ({ page }) => {
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Access spot transport through FAB or pin menu
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    
    // Look for spot transport option
    const spotButton = page.locator('text=Spot').or(page.locator('text=Report'));
    if (await spotButton.isVisible()) {
      await spotButton.click();
      
      // Should open spot transport modal
      await expect(page.locator('.spot-transport-modal')).toBeVisible();
      await expect(page.locator('text=Which bus did you spot')).toBeVisible();
      
      // Fill bus number
      await page.fill('input[placeholder*="102"]', '156K');
      
      // Should show location detection
      await expect(page.locator('text=GPS').or(page.locator('text=Location'))).toBeVisible();
      
      // ESC key compliance test
      await page.keyboard.press('Escape');
      await expect(page.locator('.spot-transport-modal')).not.toBeVisible();
    }
  });
});

test.describe('Accessibility & Responsive Design', () => {
  test('UI elements properly aligned on mobile', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.mgRoad);
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.raj.username);
    await page.fill('input[type="password"]', testUsers.raj.password);
    await page.click('button[type="submit"]');
    
    // Verify mobile layout
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Check that UI elements don't overlap
    const header = page.locator('.simplified-header');
    const fab = page.locator('.intent-action-buttons, .contextual-fab-container');
    const zoom = page.locator('.leaflet-control-zoom');
    const stats = page.locator('.transport-stats');
    
    await expect(header).toBeVisible();
    await expect(fab).toBeVisible();
    await expect(zoom).toBeVisible();
    await expect(stats).toBeVisible();
    
    // Verify FAB and zoom controls don't overlap
    const fabBox = await fab.boundingBox();
    const zoomBox = await zoom.boundingBox();
    
    if (fabBox && zoomBox) {
      // FAB should be on right, zoom on left - no overlap
      expect(fabBox.x).toBeGreaterThan(zoomBox.x + zoomBox.width);
    }
  });

  test('Keyboard navigation works correctly', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.electronicCity);
    
    await page.goto('/');
    
    // Test keyboard login
    await page.fill('input[type="text"]', testUsers.priya.username);
    await page.press('input[type="text"]', 'Tab');
    await page.fill('input[type="password"]', testUsers.priya.password);
    await page.press('input[type="password"]', 'Enter');
    
    // Should login successfully
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    
    // Test ESC key functionality across modals
    await page.locator('.leaflet-container').click({
      position: { x: 400, y: 300 }
    });
    
    if (await page.locator('.pin-context-menu').isVisible()) {
      await page.keyboard.press('Escape');
      await expect(page.locator('.pin-context-menu')).not.toBeVisible();
    }
  });
});

test.describe('Performance & Error Handling', () => {
  test('App handles location permission denial gracefully', async ({ page, context }) => {
    // Deny location permissions
    await context.grantPermissions([]);
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.maya.username);
    await page.fill('input[type="password"]', testUsers.maya.password);
    await page.click('button[type="submit"]');
    
    // App should still work without location
    await expect(page.locator('.interactive-city-map')).toBeVisible();
    await expect(page.locator('.status-card')).toBeVisible();
    
    // Should show default location or handle gracefully
    await expect(page.locator('text=location').or(page.locator('text=default'))).toBeVisible();
  });

  test('Map loads within reasonable time', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.whitefield);
    
    const startTime = Date.now();
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.priya.username);
    await page.fill('input[type="password"]', testUsers.priya.password);
    await page.click('button[type="submit"]');
    
    // Map should be visible within 5 seconds
    await expect(page.locator('.interactive-city-map')).toBeVisible({ timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // 5 second performance threshold
  });
});

test.describe('Data Integration', () => {
  test('Transport stats show realistic data', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation(locations.koramangala);
    
    await page.goto('/');
    await page.fill('input[type="text"]', testUsers.maya.username);
    await page.fill('input[type="password"]', testUsers.maya.password);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.transport-stats')).toBeVisible();
    
    // Should show some transport vehicles from seeded data
    const statNumbers = page.locator('.stat-count');
    await expect(statNumbers.first()).toBeVisible();
    
    // At least one stat should be > 0 from our seeded data
    const statTexts = await statNumbers.allTextContents();
    const hasNonZeroStats = statTexts.some(text => parseInt(text) > 0);
    expect(hasNonZeroStats).toBeTruthy();
  });
});