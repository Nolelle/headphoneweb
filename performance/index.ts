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

// Parse command line arguments
const args = process.argv.slice(2);
const testTypes = args.length > 0 ? args : ["all"];

async function runPerformanceTests() {
  console.log("🚀 Starting HeadphoneWeb Performance Tests");

  const results = {
    load: null,
    endurance: null,
    spike: null,
    frontend: null,
    database: null
  };

  try {
    // Run selected test types or all if not specified
    if (testTypes.includes("all") || testTypes.includes("load")) {
      console.log("\n📊 Running Load Tests...");
      results.load = await runLoadTests();
    }

    if (testTypes.includes("all") || testTypes.includes("endurance")) {
      console.log("\n⏱️ Running Endurance Tests...");
      results.endurance = await runEnduranceTests();
    }

    if (testTypes.includes("all") || testTypes.includes("spike")) {
      console.log("\n📈 Running Spike Tests...");
      results.spike = await runSpikeTests();
    }

    if (testTypes.includes("all") || testTypes.includes("frontend")) {
      console.log("\n🖥️ Running Frontend Performance Tests...");
      results.frontend = await runFrontendTests();
    }

    if (testTypes.includes("all") || testTypes.includes("database")) {
      console.log("\n🗄️ Running Database Performance Tests...");
      results.database = await runDatabaseTests();
    }

    // Generate consolidated report
    await generateReport(results);

    console.log("\n✅ Performance testing completed successfully");
  } catch (error) {
    console.error("\n❌ Performance testing failed:", error);
    process.exit(1);
  }
}

// Execute the tests
runPerformanceTests();
