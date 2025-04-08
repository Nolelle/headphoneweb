// performance/frontend-tests.ts
/**
 * Frontend performance testing using Lighthouse and Puppeteer
 * Measures Core Web Vitals and other key metrics across different pages
 */

import * as puppeteer from "puppeteer";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

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

// Define types for Lighthouse results - simplified version for our needs
interface SimplifiedLighthouseResult {
  lhr: {
    categories: {
      performance: {
        score: number;
      };
    };
    audits: {
      "first-contentful-paint": { numericValue: number };
      "largest-contentful-paint": { numericValue: number };
      interactive: { numericValue: number };
      "speed-index": { numericValue: number };
      "total-blocking-time": { numericValue: number };
      "cumulative-layout-shift": { numericValue: number };
      "server-response-time": { numericValue: number };
    };
  };
}

/**
 * Handles site password authentication required by the application
 */
async function authenticateSitePassword(
  browser: puppeteer.Browser
): Promise<void> {
  const page = await browser.newPage();

  try {
    console.log("Navigating to homepage to check for password protection...");
    // Go to homepage (will redirect to password page)
    await page.goto("http://localhost:3000", {
      waitUntil: "networkidle2",
      timeout: 30000 // Increase timeout to 30 seconds
    });

    // Check if we're on the password page
    const currentUrl = page.url();
    console.log(`Current URL after navigation: ${currentUrl}`);

    if (currentUrl.includes("/enter-password")) {
      console.log("Authenticating with site password...");

      // Get password from environment variables or use default
      const sitePassword = process.env.SITE_PASSWORD || "mypassword";

      // Wait for password field to be available
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });

      // Enter the site password and click the button
      await page.type('input[type="password"]', sitePassword);
      await page.click('button[type="submit"]');

      // Wait for navigation to complete
      await page.waitForNavigation({
        waitUntil: "networkidle2",
        timeout: 10000
      });

      console.log("Site password authentication successful");
    } else {
      console.log("No password protection detected, continuing with tests");
    }
  } catch (error) {
    console.error("Error during site password authentication:", error);
    console.log("Continuing with tests despite authentication error");
    // Don't throw the error to allow tests to continue
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
    console.log("Navigated to homepage");

    // Wait for the page to load
    await page.waitForSelector("body", { timeout: 10000 });
    console.log("Page loaded");

    // Log the current URL to debug
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Check if we're on a product page or need to navigate to one
    // Try to find a product link and click it if it exists
    const productLinkExists = await page.evaluate(() => {
      const productLinks = document.querySelectorAll('a[href*="product"]');
      return productLinks.length > 0;
    });

    if (productLinkExists) {
      console.log("Found product link, clicking it");
      await page.click('a[href*="product"]');
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    } else {
      console.log(
        "No product link found on homepage, proceeding with current page"
      );
    }

    // Look for any button that might add to cart - using a more generic selector
    const addToCartButtonExists = await page.evaluate(() => {
      // Check for various possible button texts
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.some(
        (button) =>
          button.textContent?.toLowerCase().includes("add to cart") ||
          button.textContent?.toLowerCase().includes("add") ||
          button.textContent?.toLowerCase().includes("cart")
      );
    });

    if (addToCartButtonExists) {
      console.log("Found add to cart button");
      // Click the button that contains text related to adding to cart
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const addButton = buttons.find(
          (button) =>
            button.textContent?.toLowerCase().includes("add to cart") ||
            button.textContent?.toLowerCase().includes("add") ||
            button.textContent?.toLowerCase().includes("cart")
        );
        if (addButton) addButton.click();
      });

      // Wait briefly for any cart update to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Product added to cart successfully");
    } else {
      console.log("No add to cart button found, skipping cart addition");
    }
  } catch (error) {
    console.error("Error adding product to cart:", error);
    // Don't throw the error - we should continue even if we can't add to cart
    console.log("Continuing with tests despite cart error");
  } finally {
    await page.close();
  }
}

/**
 * Runs Lighthouse audit on a specific page
 */
async function runLighthouseAudit(
  url: string,
  opts: { onlyCategories: string[] }
): Promise<SimplifiedLighthouseResult> {
  let chrome = null;
  try {
    // Launch Chrome
    chrome = await launch({
      chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"]
    });

    // Run Lighthouse audit
    // We use any here because of type compatibility issues between our simplified type and Lighthouse's actual types
    const runnerResult = (await lighthouse(url, {
      port: chrome.port,
      onlyCategories: opts.onlyCategories // Use the onlyCategories option passed in
      // Type casting to unknown first, then to our simplified type
    })) as unknown as SimplifiedLighthouseResult;

    // Check if audit was successful
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error("Lighthouse audit failed to produce results");
    }

    return runnerResult;
  } catch (error) {
    console.error(`Lighthouse audit failed for ${url}:`, error);
    throw error;
  } finally {
    // Always close Chrome if it was launched
    if (chrome) {
      try {
        await chrome.kill();
      } catch (err) {
        console.error("Error killing Chrome:", err);
      }
    }
  }
}

/**
 * Extracts key performance metrics from Lighthouse results
 */
function extractPerformanceMetrics(
  lhr: SimplifiedLighthouseResult["lhr"]
): Record<string, number> {
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
export async function runFrontendTests(): Promise<
  Array<Record<string, unknown>>
> {
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

    const results: Array<Record<string, unknown>> = [];

    // Test each page
    for (const page of pagesToTest) {
      console.log(`Testing ${page.name} at ${page.url}...`);

      try {
        // Run Lighthouse audit
        const runnerResult = await runLighthouseAudit(page.url, {
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
          error: error instanceof Error ? error.message : String(error),
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
