const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const artifactDir = 'C:/Users/Utkarsh Dwivedi/.gemini/antigravity/brain/4ab517c5-c607-42ff-beae-787f4a74a0f4';
  
  // 1. Screenshot of the updated Assessment Wizard
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${artifactDir}/assessment_step1_preview.png`, fullPage: true });
  console.log('Assessment Step 1 screenshot captured');

  // Open Paste Notes / Upload Deck extractor panel and screenshot
  await page.click('button:has-text("Paste Notes / Upload Deck")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDir}/assessment_doc_extractor_preview.png`, fullPage: true });
  console.log('Assessment Doc Extractor screenshot captured');
  await page.click('button:has-text("Close")');
  await page.waitForTimeout(200);

  // Click 'Funded' to reveal funding stages and take screenshot
  await page.click('button:has-text("Funded Startup")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDir}/assessment_funded_preview.png`, fullPage: true });
  console.log('Assessment Funded Stage screenshot captured');

  // Fill in company name and advance through steps
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

  // Growth step
  await page.fill('input[placeholder="Enter monthly leads"]', '1500');
  await page.fill('input[placeholder="Enter conversion rate (e.g. 0.035)"]', '0.04');
  await page.fill('input[placeholder="Enter cost per lead"]', '160');
  await page.fill('input[placeholder="Enter churn rate (e.g. 0.025 = 2.5%)"]', '0.02');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDir}/assessment_step3_cac_preview.png`, fullPage: true });
  console.log('Assessment Step 3 with Current CAC screenshot captured');

  // Advance to Step 4 (Costs & Team)
  await page.click('button:has-text("Continue to Step 04")');
  await page.waitForTimeout(300);

  // Costs step
  await page.fill('input[placeholder="Enter monthly team payroll"]', '220000');
  await page.fill('input[placeholder="Enter fixed monthly overhead"]', '110000');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${artifactDir}/assessment_step4_final_preview.png`, fullPage: true });
  console.log('Assessment Step 4 final step screenshot captured');

  // Submit directly from Step 4 to open dashboard
  await page.click('button:has-text("Build Financial Engine & Open Dashboard")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${artifactDir}/dashboard_situation_radar_overview.png`, fullPage: true });
  console.log('Dashboard overview with Situation Analysis Radar screenshot captured');

  // Click Good signals filter in Situation Analysis Radar
  await page.click('button:has-text("🟢 Good")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dashboard_radar_good_filter.png`, fullPage: true });
  console.log('Dashboard radar good filter screenshot captured');

  // Click Critical / Bad filter in Situation Analysis Radar
  await page.click('button:has-text("🔴 Critical / Bad")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${artifactDir}/dashboard_radar_bad_filter.png`, fullPage: true });
  console.log('Dashboard radar bad filter screenshot captured');

  // Reset to All Findings
  await page.click('button:has-text("All Findings")');
  await page.waitForTimeout(300);

  // Navigate to Headcount & Cash Flow tab to verify table & executive justification
  await page.click('button:has-text("Cash Flow & Hiring")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${artifactDir}/dashboard_headcount_justification.png`, fullPage: true });
  console.log('Dashboard headcount justification screenshot captured');

  await browser.close();
  console.log('All visual verification screenshots captured successfully!');
})().catch(e => {
  console.error(e);
  process.exit(1);
});
