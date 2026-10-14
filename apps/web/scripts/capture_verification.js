const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const artifactDir = 'C:/Users/Utkarsh Dwivedi/.gemini/antigravity/brain/4ab517c5-c607-42ff-beae-787f4a74a0f4';
  
  // 1. Screenshot of the updated Assessment Wizard Step 1
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/assessment_step1_preview.png`, fullPage: true });
  console.log('Assessment Step 1 screenshot captured');

  // Verify business types order and no horizon button
  // Advance through steps with empty fields to verify empty state dashboard
  await page.click('button:has-text("Continue to Step 02")');
  await page.waitForTimeout(300);
  await page.click('button:has-text("Continue to Step 03")');
  await page.waitForTimeout(300);

  // Capture Step 3 showing Current CAC, Target CAC, and Percentage/Decimal switcher
  await page.screenshot({ path: `${artifactDir}/assessment_step3_cac_preview.png`, fullPage: true });
  console.log('Assessment Step 3 with Current CAC, Target CAC & % switcher captured');

  // Advance to Step 4
  await page.click('button:has-text("Continue to Step 04")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDir}/assessment_step4_final_preview.png`, fullPage: true });
  console.log('Assessment Step 4 final preview captured');

  // Submit completely empty to verify empty state dashboard
  await page.click('button:has-text("Build Financial Engine & Open Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${artifactDir}/dashboard_empty_state_overview.png`, fullPage: true });
  console.log('Dashboard Empty State (All N/A, zero flags, no triggers) captured');

  // Now click "Retake Assessment" to test populated data flow
  await page.click('button:has-text("Retake Assessment")');
  await page.waitForTimeout(500);

  // Fill in company details
  await page.fill('input[placeholder="Enter company name"]', 'VenturePulse Analytics');
  await page.click('button:has-text("Continue to Step 02")');
  await page.waitForTimeout(300);

  // Fill in baseline numbers
  await page.fill('input[placeholder="Enter paying customer count"]', '60');
  await page.fill('input[placeholder="Enter monthly price per customer"]', '4500');
  await page.fill('input[placeholder="Enter liquid bank cash"]', '4000000');
  await page.fill('input[placeholder="Enter safety reserve floor"]', '800000');
  await page.click('button:has-text("Continue to Step 03")');
  await page.waitForTimeout(300);

  // Step 3 inputs with comma numbers and percentages
  await page.fill('input[placeholder="Enter monthly leads"]', '1500');
  await page.fill('input[placeholder="Enter cost per lead"]', '160');
  await page.fill('input[placeholder*="current CAC"]', '4000');
  await page.fill('input[placeholder*="target CAC"]', '3500');
  
  // Percentage inputs
  const percentInputs = page.locator('input[placeholder*="%"]');
  if (await percentInputs.count() > 0) {
    await percentInputs.first().fill('4.0');
  }

  await page.click('button:has-text("Continue to Step 04")');
  await page.waitForTimeout(300);

  // Step 4 costs
  await page.fill('input[placeholder="Enter monthly team payroll"]', '220000');
  await page.fill('input[placeholder="Enter fixed monthly overhead"]', '110000');
  await page.waitForTimeout(300);

  // Submit to open populated dashboard
  await page.click('button:has-text("Build Financial Engine & Open Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${artifactDir}/dashboard_situation_radar_overview.png`, fullPage: true });
  console.log('Dashboard populated overview with Situation Analysis Radar captured');

  // Test Good filter
  await page.click('button:has-text("🟢 Good")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dashboard_radar_good_filter.png`, fullPage: true });
  console.log('Dashboard radar good filter screenshot captured');

  // Reset to All Findings
  await page.click('button:has-text("All Findings")');
  await page.waitForTimeout(300);

  // Headcount & Cash Flow tab
  await page.click('button:has-text("Cash Flow & Hiring")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/dashboard_headcount_justification.png`, fullPage: true });
  console.log('Dashboard headcount tab screenshot captured');

  await browser.close();
  console.log('All visual verification screenshots captured successfully!');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
