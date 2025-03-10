// performance/frontend-tests.ts
/**
 * Frontend performance testing using Lighthouse and Puppeteer
 * Measures Core Web Vitals and other key metrics across different pages
 */

import puppeteer from "puppeteer";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// Define the pages to test
const pagesToTest = [
  { name: "homepage", url: "http://localhost:3000" },
  { name: "cart", url: "http://localhost:3000/cart" },
  { name: "checkout", url: "http://localhost:3000/checkout" }
];

// Core Web Vitals thresholds for pass/fail evaluation
const thresholds = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100, // First Input Delay (ms)
  CLS: 0.1, // Cumulative Layout Shift (unitless)
  TTI: 3500, // Time to Interactive (ms)
  TBT: 200, // Total Blocking Time (ms)
  TTFB: 600 // Time to First Byte (ms)
};

/**
 * Handles site password authentication required by the application
 */
async function authenticateSitePassword(
  browser: puppeteer.Browser
): Promise<void> {
  const page = await browser.newPage();

  try {
    // Go to homepage (will redirect to password page)
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Check if we're on the password page
    const currentUrl = page.url();
    if (currentUrl.includes("/enter-password")) {
      console.log("Authenticating with site password...");

      // Enter the site password and click the button
      await page.type('input[type="password"]', "mypassword");
      await page.click('button[type="submit"]');

      // Wait for navigation to complete
      await page.waitForNavigation({ waitUntil: "networkidle2" });

      console.log("Site password authentication successful");
    }
  } catch (error) {
    console.error("Error during site password authentication:", error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Adds a product to cart for testing cart and checkout pages
 */
async function addProductToCart(browser: puppeteer.Browser): Promise<void> {
  const page = await browser.newPage();

  try {
    // Go to homepage
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });

    // Scroll to product section
    await page.evaluate(() => {
      const element = document.getElementById("headphone");
      if (element) element.scrollIntoView();
    });

    // Wait for product info to be visible
    await page.waitForSelector('button:has-text("Add to Cart")');

    // Click the Add to Cart button
    await page.click('button:has-text("Add to Cart")');

    // Wait for the success message/toast
    await page
      .waitForSelector('div:has-text("Added to cart")', { timeout: 5000 })
      .catch(() =>
        console.log("No toast notification found, proceeding anyway")
      );

    console.log("Product added to cart successfully");
  } catch (error) {
    console.error("Error adding product to cart:", error);
    throw error;
  } finally {
    await page.close();
  }
}

/**
 * Runs Lighthouse audit on a specific page
 */
async function runLighthouseAudit(url: string, options: any): Promise<any> {
  // Launch Chrome
  const chrome = await launch({
    chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"]
  });

  try {
    // Run Lighthouse audit
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "info",
      ...options
    });

    // Check if audit was successful
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error("Lighthouse audit failed to produce results");
    }

    return runnerResult;
  } finally {
    // Always close Chrome
    await chrome.kill();
  }
}

/**
 * Extracts key performance metrics from Lighthouse results
 */
function extractPerformanceMetrics(lhr: any): Record<string, number> {
  // Core Web Vitals and other key metrics
  const metrics = {
    "Performance Score": lhr.categories.performance.score * 100,
    "First Contentful Paint (FCP)":
      lhr.audits["first-contentful-paint"].numericValue,
    "Largest Contentful Paint (LCP)":
      lhr.audits["largest-contentful-paint"].numericValue,
    "Time to Interactive (TTI)": lhr.audits["interactive"].numericValue,
    "Speed Index": lhr.audits["speed-index"].numericValue,
    "Total Blocking Time (TBT)": lhr.audits["total-blocking-time"].numericValue,
    "Cumulative Layout Shift (CLS)":
      lhr.audits["cumulative-layout-shift"].numericValue,
    "Time to First Byte (TTFB)": lhr.audits["server-response-time"].numericValue
  };

  return metrics;
}

/**
 * Evaluates performance metrics against thresholds
 */
function evaluatePerformance(
  metrics: Record<string, number>
): Record<string, boolean> {
  const evaluations = {
    FCP: metrics["First Contentful Paint (FCP)"] < thresholds.FCP,
    LCP: metrics["Largest Contentful Paint (LCP)"] < thresholds.LCP,
    TTI: metrics["Time to Interactive (TTI)"] < thresholds.TTI,
    TBT: metrics["Total Blocking Time (TBT)"] < thresholds.TBT,
    CLS: metrics["Cumulative Layout Shift (CLS)"] < thresholds.CLS,
    TTFB: metrics["Time to First Byte (TTFB)"] < thresholds.TTFB,
    Overall: metrics["Performance Score"] >= 80 // 80% score threshold
  };

  return evaluations;
}

/**
 * Runs frontend performance tests on all defined pages
 */
export async function runFrontendTests(): Promise<any> {
  console.log("Starting frontend performance tests...");

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    // First authenticate with the site password
    await authenticateSitePassword(browser);

    // Add a product to cart for cart and checkout page testing
    await addProductToCart(browser);

    const results = [];

    // Test each page
    for (const page of pagesToTest) {
      console.log(`Testing ${page.name} at ${page.url}...`);

      try {
        // Run Lighthouse audit
        const runnerResult = await runLighthouseAudit(page.url, {
          // Custom settings for Lighthouse
          onlyCategories: ["performance"]
        });

        // Extract the lighthouse result
        const { lhr } = runnerResult;

        // Save full report
        const reportPath = path.join(
          resultsDir,
          `${page.name}-lighthouse.json`
        );
        writeFileSync(reportPath, JSON.stringify(lhr, null, 2));

        // Extract key metrics
        const metrics = extractPerformanceMetrics(lhr);

        // Evaluate against thresholds
        const evaluations = evaluatePerformance(metrics);

        // Add to results
        results.push({
          page: page.name,
          url: page.url,
          metrics,
          evaluations,
          passed: evaluations.Overall
        });

        console.log(`Completed testing ${page.name}`);
      } catch (error) {
        console.error(`Error testing ${page.name}:`, error);
        results.push({
          page: page.name,
          url: page.url,
          error: error.message,
          passed: false
        });
      }
    }

    // Save consolidated results
    const summaryPath = path.join(
      resultsDir,
      "frontend-performance-summary.json"
    );
    writeFileSync(summaryPath, JSON.stringify(results, null, 2));

    return results;
  } finally {
    await browser.close();
  }
}
