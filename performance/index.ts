// performance/index.ts
/**
 * Main entry point for performance testing
 * This file orchestrates the different types of performance tests
 */

import { runLoadTests } from "./load-tests";
import { runEnduranceTests } from "./endurance-tests";
import { runSpikeTests } from "./spike-tests";
import { runFrontendTests } from "./frontend-tests";
import { runDatabaseTests } from "./database-tests";
import { generateReport } from "./reporting";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const testTypes =
  args.length > 0 ? args.filter((arg) => !arg.startsWith("quick")) : ["all"];
const quickMode = args.includes("quick");

// Define types for test results
interface BaseTestResult {
  name?: string;
  success?: boolean;
  error?: string;
}

// Define a type for test results that can include errors
type TestResult =
  | BaseTestResult
  | Record<string, unknown>
  | Array<Record<string, unknown>>
  | Array<BaseTestResult>
  | null;

async function runPerformanceTests() {
  console.log("🚀 Starting HeadphoneWeb Performance Tests");
  if (quickMode) {
    console.log(
      "🔥 Running in QUICK MODE - tests will complete faster but may be less accurate"
    );
  }

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
    console.log("Created results directory at:", resultsDir);
  }

  const results: {
    load: TestResult;
    endurance: TestResult;
    spike: TestResult;
    frontend: TestResult;
    database: TestResult;
  } = {
    load: null,
    endurance: null,
    spike: null,
    frontend: null,
    database: null
  };

  let hasErrors = false;

  try {
    // Run selected test types or all if not specified
    if (testTypes.includes("all") || testTypes.includes("load")) {
      console.log("\n📊 Running Load Tests...");
      try {
        results.load = await runLoadTests();
      } catch (error) {
        console.error("❌ Load tests failed:", error);
        hasErrors = true;
        results.load = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    if (testTypes.includes("all") || testTypes.includes("endurance")) {
      console.log("\n⏱️ Running Endurance Tests...");
      try {
        results.endurance = await runEnduranceTests();
      } catch (error) {
        console.error("❌ Endurance tests failed:", error);
        hasErrors = true;
        results.endurance = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    if (testTypes.includes("all") || testTypes.includes("spike")) {
      console.log("\n📈 Running Spike Tests...");
      try {
        results.spike = await runSpikeTests(quickMode);
      } catch (error) {
        console.error("❌ Spike tests failed:", error);
        hasErrors = true;
        results.spike = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    if (testTypes.includes("all") || testTypes.includes("frontend")) {
      console.log("\n🖥️ Running Frontend Performance Tests...");
      try {
        results.frontend = await runFrontendTests();
      } catch (error) {
        console.error("❌ Frontend tests failed:", error);
        hasErrors = true;
        results.frontend = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    if (testTypes.includes("all") || testTypes.includes("database")) {
      console.log("\n🗄️ Running Database Performance Tests...");
      try {
        results.database = await runDatabaseTests();
      } catch (error) {
        console.error("❌ Database tests failed:", error);
        hasErrors = true;
        results.database = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }

    // Generate consolidated report
    await generateReport(results);

    if (hasErrors) {
      console.log("\n⚠️ Performance testing completed with some errors");
      process.exit(1);
    } else {
      console.log("\n✅ Performance testing completed successfully");
    }
  } catch (error) {
    console.error("\n❌ Performance testing failed:", error);
    process.exit(1);
  }
}

// Execute the tests
runPerformanceTests();
