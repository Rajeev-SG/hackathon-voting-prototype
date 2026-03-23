const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots-latest');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const routes = [
  { name: 'projects-dashboard', url: '/projects' },
  { name: 'project-details', url: '/projects/eco-track-ai' },
  { name: 'project-scoring', url: '/projects/eco-track-ai/score' },
  { name: 'results-scoreboard', url: '/results' },
  { name: 'upload-assets', url: '/submission/assets' },
];

async function takeScreenshots() {
  console.log('Starting Playwright...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark', // Let's capture in dark mode or adjust as needed
  });
  
  const page = await context.newPage();

  for (const route of routes) {
    const fullUrl = `${BASE_URL}${route.url}`;
    console.log(`Navigating to ${fullUrl}...`);
    
    try {
      await page.goto(fullUrl, { waitUntil: 'load' });
      
      // Wait a bit extra for any animations/fonts/data to load
      await page.waitForTimeout(2000);
      
      const screenshotPath = path.join(OUTPUT_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ Saved screenshot to ${screenshotPath}`);
    } catch (error) {
      console.error(`❌ Failed to screenshot ${route.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

takeScreenshots().catch(console.error);
