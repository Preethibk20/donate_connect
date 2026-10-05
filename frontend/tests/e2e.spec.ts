import { test, expect } from '@playwright/test';

test.describe('DonateConnect Full Flow E2E', () => {
  // Use a predictable email for the test
  const donorEmail = `donor_${Date.now()}@example.com`;
  const ngoEmail = `ngo_${Date.now()}@example.com`;
  const courierEmail = `courier_${Date.now()}@example.com`;
  const password = 'Password123!';

  test('Full flow: Donor -> NGO -> Courier -> Delivery -> OTP', async ({ page, browser }) => {
    test.setTimeout(120000); // This test might take a while

    // --- 1. NGO Registration & Approval ---
    // Note: If you have seed data that creates an NGO and a Courier, we can just use those.
    // The instructions say "B) Playwright E2E, one headless test of the full flow...".
    // We have app.seed.enabled=true in application-e2e.properties which creates default users.
    // Default users from DataInitializer: 
    // donor@example.com, ngo@example.com, courier@example.com, admin@example.com
    // So we don't need to register them.

    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    page.on('response', async response => {
      if (response.status() >= 400) {
        console.log(`ERROR RESPONSE HTTP ${response.status()} from ${response.url()}`);
        console.log(`Request Payload:`, response.request().postData());
        try {
          console.log(`Response Body:`, await response.text());
        } catch(e) { }
      }
    });

    // --- 2. Donor Login & Create Donation ---
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'priya.patel@gmail.com');
    await page.fill('input[name="password"]', 'donor123');
    
    // Log network response for login to debug
    const [loginResponse] = await Promise.all([
      page.waitForResponse('**/api/auth/login'),
      page.click('button[type="submit"]')
    ]);
    console.log(`Login response status: ${loginResponse.status()}`);
    console.log(`Login response body: ${await loginResponse.text()}`);

    await expect(page).toHaveURL('http://localhost:5173/donations');

    await page.click('a[href="/donate/new"]');
    await expect(page).toHaveURL('http://localhost:5173/donate/new');

    // Fill Donation Form
    await page.selectOption('select[name="ngoId"]', { index: 1 }); // select first NGO
    await page.selectOption('select[name="category"]', 'CLOTHES');
    
    // Valid Date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    
    await page.selectOption('select[name="pickupTimeSlot"]', 'MORNING_9_12');
    await page.fill('input[name="pickupAddress"]', '123 E2E Test St, Bangalore, Karnataka');
    
    // Upload photo
    // Provide a dummy image in memory or from a fixture
    // Playwright lets you set input files
    const buffer = Buffer.from('dummy image', 'utf-8');
    await page.setInputFiles('input[type="file"]', {
      name: 'test.png',
      mimeType: 'image/png',
      buffer
    });

    await page.fill('textarea[name="description"]', 'These are some E2E test clothes in good condition.');

    // Note: Map is mocked in component tests, but in E2E it renders real Leaflet map.
    // To click the map to set mapPosition:
    const map = page.locator('.leaflet-container');
    await map.click();

    const [donationResponse] = await Promise.all([
      page.waitForResponse('**/api/donations'),
      page.click('button:has-text("Submit Donation Request")')
    ]);

    const requestBody = donationResponse.request().postData();
    const responseBody = await donationResponse.text();
    console.log("DONATION POST REQUEST PAYLOAD: " + requestBody);
    console.log("DONATION POST RESPONSE STATUS: " + donationResponse.status());
    console.log("DONATION POST RESPONSE BODY: " + responseBody);

    await expect(page).toHaveURL('http://localhost:5173/donations');

    // Get the donation ID or just logout
    await page.locator('button[title="Account menu"]').click();
    await page.click('button:has-text("Sign Out")');

    // --- 3. NGO Login & Accept Donation ---
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'contact@goonj.org');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // NGO Dashboard should show pending donations
    await expect(page).toHaveURL('http://localhost:5173/ngo-dashboard');
    
    // Find the donation card and Accept
    // Wait for the specific donation text
    const donationCard = page.locator('.donation-card', { hasText: 'These are some E2E test clothes' }).first();
    await donationCard.locator('button:has-text("Accept")').click();
    
    await page.locator('button[title="Account menu"]').click();
    await page.click('button:has-text("Sign Out")');

    // --- 4. Courier Login & Claim Delivery ---
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'dispatch@donateconnect.in');
    await page.fill('input[type="password"]', 'driver123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5173/driver/dashboard');
    
    // Go to Available Deliveries
    // The driver dashboard usually lists available ones
    const deliveryCard = page.locator('.delivery-card', { hasText: '123 E2E Test St, Bangalore' }).first();
    await deliveryCard.locator('button:has-text("Claim")').click();
    
    // Once claimed, it should move to "My Deliveries" or similar, or allow status updates
    // Update status to PICKED_UP
    const myDelivery = page.locator('.my-delivery-card', { hasText: '123 E2E Test St, Bangalore' }).first();
    await myDelivery.locator('button:has-text("Update Status")').click();
    await page.selectOption('select[name="status"]', 'PICKED_UP');
    await page.click('button:has-text("Save")');

    // Now track delivery to complete it
    await myDelivery.locator('a:has-text("Track Delivery")').click();
    
    // We are on track page
    await expect(page.locator('h1')).toContainText('Live Delivery Tracking');

    // Wait for the Complete Delivery section
    const completeSection = page.locator('text="Complete Delivery"');
    await expect(completeSection).toBeVisible();

    // To enter OTP, we would normally get it from the NGO's email or dashboard. 
    // In our backend, verifyOtp API expects the OTP or maybe the NGO generates it?
    // Wait, completeDelivery API expects an OTP.
    // For the test, maybe we need to fetch the OTP from the database or the NGO dashboard.
    // If the OTP is generated upon assignment and sent via email/notification to NGO, we need another context to read it.
    
    // Create second context for NGO to read OTP
    const ngoContext = await browser.newContext();
    const ngoPage = await ngoContext.newPage();
    await ngoPage.goto('http://localhost:5173/login');
    await ngoPage.fill('input[type="email"]', 'info@akshayapatra.org');
    await ngoPage.fill('input[type="password"]', 'password123');
    await ngoPage.click('button[type="submit"]');
    
    await ngoPage.goto('http://localhost:5173/ngo/dashboard');
    // Assume the NGO can see the OTP on the donation details
    await ngoPage.locator('.donation-card', { hasText: 'These are some E2E test clothes' }).first().click();
    
    // Find OTP in details modal
    const otpText = await ngoPage.locator('[data-testid="delivery-otp"]').innerText();
    
    // Back to courier page
    await page.bringToFront();

    // Enter OTP using OtpInput (6 individual inputs)
    for (let i = 0; i < 6; i++) {
      await page.locator(`input[inputmode="numeric"]`).nth(i).fill(otpText[i]);
    }
    
    // Upload proof image
    await page.setInputFiles('input[type="file"]', {
      name: 'proof.png',
      mimeType: 'image/png',
      buffer
    });

    // Submit
    await page.click('button:has-text("Complete Delivery")');
    
    // Verify success
    await expect(page.locator('text="Delivery Completed"')).toBeVisible();

    await ngoContext.close();
  });
});
