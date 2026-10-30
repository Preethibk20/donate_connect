import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

async function recordFullWorkingDemo() {
  const outputDir = path.resolve('recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('========================================================');
  console.log('STARTING FULL WORKING DONATECONNECT AUTOMATED RECORDING');
  console.log('========================================================\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 700 // Smooth, slow pace so viewers can read all text, see typing, and watch interactions
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  async function performVisibleLogin(roleName, customEmail, customPassword) {
    console.log(`\n>>> VISIBLE UI LOGIN: Role = ${roleName} (${customEmail})`);
    await page.goto('http://localhost:5174/login');
    await page.waitForTimeout(1800);

    // Click the visible role tab button
    const tabBtn = await page.$(`button:has-text("${roleName}")`);
    if (tabBtn) {
      await tabBtn.click();
      await page.waitForTimeout(1000);
    }

    if (customEmail) {
      await page.fill('input[type="email"]', '');
      await page.fill('input[type="email"]', customEmail);
      await page.waitForTimeout(600);
    }
    if (customPassword) {
      await page.fill('input[type="password"]', '');
      await page.fill('input[type="password"]', customPassword);
      await page.waitForTimeout(600);
    }

    // Click the big Sign In button on screen
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForTimeout(3000);
  }

  async function visibleLogout() {
    console.log('Logging out to switch accounts...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.waitForTimeout(1000);
  }

  try {
    // ----------------------------------------------------
    // SCENE 1: Public Homepage & Mission Showcase
    // ----------------------------------------------------
    console.log('SCENE 1: Public Homepage Showcase...');
    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(3000);
    
    // Smooth scroll down to showcase live impact stats and features
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, -1000);
    await page.waitForTimeout(2000);

    // ----------------------------------------------------
    // SCENE 2: Donor Visible Login & Donation Management
    // ----------------------------------------------------
    console.log('SCENE 2: Donor Visible Login (Priya Patel)...');
    await performVisibleLogin('Donor', 'priya.patel@gmail.com', 'donor123');

    // Donor History
    await page.goto('http://localhost:5174/donations');
    await page.waitForTimeout(3500);
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(1500);

    // Tour the New Donation creation page
    console.log('Showing New Donation Creation Portal...');
    const newDonationBtn = await page.$('a:has-text("New Donation")');
    if (newDonationBtn) {
      await newDonationBtn.click();
    } else {
      await page.goto('http://localhost:5174/donations/new');
    }
    await page.waitForTimeout(3500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(1500);

    // ----------------------------------------------------
    // SCENE 3: NGO Visible Login & Order Inspection (Akshaya Patra)
    // ----------------------------------------------------
    console.log('SCENE 3: NGO Visible Login (Akshaya Patra Foundation - Bengaluru)...');
    await visibleLogout();
    await performVisibleLogin('NGO', 'info@akshayapatra.org', 'password123');

    // NGO Dashboard
    await page.goto('http://localhost:5174/ngo-dashboard');
    await page.waitForTimeout(4000);
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(2500);

    // Look for OTP inspection button
    const otpButtons = await page.$$('button:has-text("View OTP"), button:has-text("Delivery OTP")');
    if (otpButtons.length > 0) {
      console.log('Revealing Delivery Handover OTP...');
      await otpButtons[0].click();
      await page.waitForTimeout(3000);
    }
    await page.mouse.wheel(0, -350);
    await page.waitForTimeout(1500);

    // ----------------------------------------------------
    // SCENE 4: Volunteer Delivery Driver & Live Shortest Route GPS
    // ----------------------------------------------------
    console.log('SCENE 4: Delivery Driver Visible Login (Vikram Singh)...');
    await visibleLogout();
    await performVisibleLogin('Delivery', 'dispatch@donateconnect.in', 'driver123');

    // Driver Dashboard
    await page.goto('http://localhost:5174/driver-dashboard');
    await page.waitForTimeout(4000);

    // Show Available Pickups Tab (demonstrating Accept/Decline options)
    console.log('Inspecting Available Pickups with Accept/Decline...');
    const availableTab = await page.$('button:has-text("Available Pickups")');
    if (availableTab) {
      await availableTab.click();
      await page.waitForTimeout(3000);
    }

    // Switch back to My Active Deliveries
    const myTasksTab = await page.$('button:has-text("My Active Deliveries")');
    if (myTasksTab) {
      await myTasksTab.click();
      await page.waitForTimeout(2500);
    }

    // Open Live Shortest Route & GPS Screen
    console.log('Opening Live Shortest Route & GPS Navigation...');
    const routeGpsBtn = await page.$('button:has-text("Shortest Route & GPS")');
    if (routeGpsBtn) {
      await routeGpsBtn.click();
      await page.waitForTimeout(5000);

      // Demonstrate Shortest vs Fastest route strategy toggle
      console.log('Toggling between Fastest ETA and Shortest Path...');
      const fastestBtn = await page.$('button:has-text("Fastest ETA")');
      if (fastestBtn) {
        await fastestBtn.click();
        await page.waitForTimeout(2500);
      }

      const shortestBtn = await page.$('button:has-text("Shortest Path")');
      if (shortestBtn) {
        await shortestBtn.click();
        await page.waitForTimeout(2500);
      }

      // Scroll around map and controls
      await page.mouse.wheel(0, 450);
      await page.waitForTimeout(3500);
      await page.mouse.wheel(0, -450);
      await page.waitForTimeout(2000);
    }

    // ----------------------------------------------------
    // SCENE 5: Corporate CSR Portal Visible Login
    // ----------------------------------------------------
    console.log('SCENE 5: Corporate CSR Portal Visible Login (Tata Trust CSR)...');
    await visibleLogout();
    await performVisibleLogin('Donor', 'csr@tata.com', 'corporate123');
    await page.goto('http://localhost:5174/csr-dashboard');
    await page.waitForTimeout(4500);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(2500);
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(1500);

    // ----------------------------------------------------
    // SCENE 6: Immutable SHA-256 Blockchain Ledger
    // ----------------------------------------------------
    console.log('SCENE 6: Cryptographic Blockchain Ledger...');
    await page.goto('http://localhost:5174/blockchain-ledger');
    await page.waitForTimeout(5000);
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(3500);
    await page.mouse.wheel(0, -500);
    await page.waitForTimeout(2000);

    console.log('\n========================================================');
    console.log('RECORDING COMPLETED SUCCESSFULLY!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('Error during recording:', err);
  } finally {
    const video = await page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const finalDest = path.join(outputDir, 'DonateConnect_Full_Working_Demo.webm');
      try {
        fs.copyFileSync(videoPath, finalDest);
        console.log(`SAVED DEMO TO: ${finalDest}`);

        // Copy to root workspace
        const rootDest1 = path.resolve('../DonateConnect_Full_Working_Demo.webm');
        const rootDest2 = path.resolve('../DonateConnect_Bangalore_Demo.webm');
        fs.copyFileSync(videoPath, rootDest1);
        fs.copyFileSync(videoPath, rootDest2);
        console.log(`COPIED TO ROOT: ${rootDest1}`);
        console.log(`COPIED TO ROOT: ${rootDest2}`);
      } catch (e) {
        console.error('File copy failed:', e);
      }
    }
  }
}

recordFullWorkingDemo();
