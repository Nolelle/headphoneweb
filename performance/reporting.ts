// performance/reporting.ts
/**
 * Reporting module for performance tests
 * Generates consolidated reports and visualizations
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * Generates a consolidated report from all test results
 */
export async function generateReport(results: any): Promise<void> {
  console.log("Generating performance test report...");

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Generate timestamp for report
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  // Consolidate all results
  const reportData = {
    timestamp,
    summary: generateSummary(results),
    details: results
  };

  // Save JSON report
  const reportPath = path.join(
    resultsDir,
    `performance-report-${timestamp}.json`
  );
  writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

  // Generate HTML report
  await generateHtmlReport(reportData, timestamp);

  console.log(`Report generated at: ${reportPath}`);
}

/**
 * Generates a summary of all test results
 */
function generateSummary(results: any): any {
  const summary: any = {
    status: "completed",
    testTypes: Object.keys(results).filter((key) => results[key] !== null),
    pass: true,
    metrics: {
      frontend: {},
      database: {},
      endurance: {},
      spike: {},
      load: {}
    }
  };

  // Determine overall pass/fail status
  let anyFailed = false;

  // Process load test results
  if (results.load) {
    const loadTests = results.load;
    const passedTests = loadTests.filter((test: any) => test.success).length;
    summary.metrics.load = {
      total: loadTests.length,
      passed: passedTests,
      failed: loadTests.length - passedTests,
      passRate: (passedTests / loadTests.length) * 100
    };

    if (passedTests < loadTests.length) {
      anyFailed = true;
    }
  }

  // Process frontend test results
  if (results.frontend) {
    const frontendTests = results.frontend;
    let totalPassed = 0;
    let totalMetrics = 0;

    // Ensure frontendTests is an array before attempting to iterate
    if (Array.isArray(frontendTests)) {
      // Count individual metric passes vs. fails
      frontendTests.forEach((test: any) => {
        if (test.evaluations) {
          const evaluationKeys = Object.keys(test.evaluations);
          totalMetrics += evaluationKeys.length;

          totalPassed += evaluationKeys.filter(
            (key) => test.evaluations[key] === true
          ).length;
        }

        if (!test.passed) {
          anyFailed = true;
        }
      });

      summary.metrics.frontend = {
        pages: frontendTests.length,
        metrics: totalMetrics,
        passed: totalPassed,
        failed: totalMetrics - totalPassed,
        passRate: totalMetrics > 0 ? (totalPassed / totalMetrics) * 100 : 0
      };
    } else {
      // Handle case where frontendTests is not an array (could be an error object)
      summary.metrics.frontend = {
        pages: 0,
        metrics: 0,
        passed: 0,
        failed: 0,
        passRate: 0,
        error: frontendTests.error || "Unknown error in frontend tests"
      };
      anyFailed = true;
    }
  }

  // Process database test results
  if (results.database) {
    const dbTests = results.database;
    const passedTests = dbTests.filter((test: any) => test.success).length;

    // Calculate averages of performance metrics
    const p95Times = dbTests
      .filter((test: any) => test.stats && test.stats.p95)
      .map((test: any) => test.stats.p95);

    const avgP95 =
      p95Times.length > 0
        ? p95Times.reduce((sum: number, time: number) => sum + time, 0) /
          p95Times.length
        : 0;

    summary.metrics.database = {
      total: dbTests.length,
      passed: passedTests,
      failed: dbTests.length - passedTests,
      passRate: (passedTests / dbTests.length) * 100,
      avgP95ResponseTime: avgP95
    };

    if (passedTests < dbTests.length) {
      anyFailed = true;
    }
  }

  // Process endurance test results
  if (results.endurance) {
    const enduranceTests = results.endurance;
    const passedTests = enduranceTests.filter(
      (test: any) => test.success
    ).length;

    summary.metrics.endurance = {
      total: enduranceTests.length,
      passed: passedTests,
      failed: enduranceTests.length - passedTests,
      passRate: (passedTests / enduranceTests.length) * 100
    };

    if (passedTests < enduranceTests.length) {
      anyFailed = true;
    }
  }

  // Process spike test results
  if (results.spike) {
    const spikeTests = results.spike;
    const passedTests = spikeTests.filter((test: any) => test.success).length;

    // Calculate average recovery times
    const recoveryTimes = spikeTests
      .filter(
        (test: any) => test.recovery && test.recovery.recoveryTimeSeconds > 0
      )
      .map((test: any) => test.recovery.recoveryTimeSeconds);

    const avgRecoveryTime =
      recoveryTimes.length > 0
        ? recoveryTimes.reduce((sum: number, time: number) => sum + time, 0) /
          recoveryTimes.length
        : 0;

    summary.metrics.spike = {
      total: spikeTests.length,
      passed: passedTests,
      failed: spikeTests.length - passedTests,
      passRate: (passedTests / spikeTests.length) * 100,
      avgRecoveryTimeSeconds: avgRecoveryTime
    };

    if (passedTests < spikeTests.length) {
      anyFailed = true;
    }
  }

  summary.pass = !anyFailed;

  return summary;
}

/**
 * Generates an HTML report with visualizations
 */
async function generateHtmlReport(
  reportData: any,
  timestamp: string
): Promise<void> {
  // HTML template with placeholder for data
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HeadphoneWeb Performance Test Report</title>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        header {
          background-color: #2563eb;
          color: white;
          padding: 20px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        h1, h2, h3 {
          margin-top: 0;
        }
        .overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .overview-card {
          background-color: #f8fafc;
          border-radius: 5px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .status {
          font-weight: bold;
          text-transform: uppercase;
        }
        .status.pass {
          color: #16a34a;
        }
        .status.fail {
          color: #dc2626;
        }
        .chart-container {
          height: 300px;
          margin-bottom: 30px;
        }
        .details {
          margin-top: 40px;
        }
        .test-section {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f8fafc;
          border-radius: 5px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f1f5f9;
        }
        tr:hover {
          background-color: #f1f5f9;
        }
      </style>
    </head>
    <body>
      <header>
        <h1>HeadphoneWeb Performance Test Report</h1>
        <p>Generated on: ${new Date(timestamp).toLocaleString()}</p>
      </header>
      
      <div class="overview">
        <div class="overview-card">
          <h2>Summary</h2>
          <p>Overall Status: <span class="status ${
            reportData.summary.pass ? "pass" : "fail"
          }">${reportData.summary.pass ? "PASS" : "FAIL"}</span></p>
          <p>Test Types: ${reportData.summary.testTypes.join(", ")}</p>
        </div>
      </div>
      
      <div class="chart-container">
        <canvas id="passRateChart"></canvas>
      </div>
      
      <div class="chart-container">
        <canvas id="responseTimeChart"></canvas>
      </div>
      
      <div class="details">
        <h2>Detailed Results</h2>
        
        <!-- Load Tests Section -->
        ${
          reportData.details.load
            ? `
        <div class="test-section">
          <h3>Load Tests</h3>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.load
                .map(
                  (test: any) => `
                <tr>
                  <td>${test.name}</td>
                  <td class="status ${test.success ? "pass" : "fail"}">${
                    test.success ? "PASS" : "FAIL"
                  }</td>
                  <td>${test.error || "Completed successfully"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        
        <!-- Frontend Tests Section -->
        ${
          reportData.details.frontend
            ? `
        <div class="test-section">
          <h3>Frontend Performance Tests</h3>
          <table>
            <thead>
              <tr>
                <th>Page</th>
                <th>Status</th>
                <th>LCP (ms)</th>
                <th>FCP (ms)</th>
                <th>CLS</th>
                <th>TTI (ms)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.frontend
                .map(
                  (test: any) => `
                <tr>
                  <td>${test.page}</td>
                  <td class="status ${test.passed ? "pass" : "fail"}">${
                    test.passed ? "PASS" : "FAIL"
                  }</td>
                  <td>${
                    test.metrics
                      ? Math.round(
                          test.metrics["Largest Contentful Paint (LCP)"]
                        )
                      : "N/A"
                  }</td>
                  <td>${
                    test.metrics
                      ? Math.round(test.metrics["First Contentful Paint (FCP)"])
                      : "N/A"
                  }</td>
                  <td>${
                    test.metrics
                      ? test.metrics["Cumulative Layout Shift (CLS)"].toFixed(3)
                      : "N/A"
                  }</td>
                  <td>${
                    test.metrics
                      ? Math.round(test.metrics["Time to Interactive (TTI)"])
                      : "N/A"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        
        <!-- Database Tests Section -->
        ${
          reportData.details.database
            ? `
        <div class="test-section">
          <h3>Database Performance Tests</h3>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Avg (ms)</th>
                <th>p95 (ms)</th>
                <th>p99 (ms)</th>
                <th>Max (ms)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.database
                .map(
                  (test: any) => `
                <tr>
                  <td>${test.name}</td>
                  <td class="status ${test.success ? "pass" : "fail"}">${
                    test.success ? "PASS" : "FAIL"
                  }</td>
                  <td>${test.stats ? Math.round(test.stats.avg) : "N/A"}</td>
                  <td>${test.stats ? Math.round(test.stats.p95) : "N/A"}</td>
                  <td>${test.stats ? Math.round(test.stats.p99) : "N/A"}</td>
                  <td>${test.stats ? Math.round(test.stats.max) : "N/A"}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        
        <!-- Endurance Tests Section -->
        ${
          reportData.details.endurance
            ? `
        <div class="test-section">
          <h3>Endurance Tests</h3>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Avg CPU Usage</th>
                <th>Avg Memory Usage</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.endurance
                .map(
                  (test: any) => `
                <tr>
                  <td>${test.name}</td>
                  <td class="status ${test.success ? "pass" : "fail"}">${
                    test.success ? "PASS" : "FAIL"
                  }</td>
                  <td>${
                    test.systemMetrics
                      ? `${test.systemMetrics.averageCpuUsage.toFixed(2)}%`
                      : "N/A"
                  }</td>
                  <td>${
                    test.systemMetrics
                      ? `${test.systemMetrics.averageMemoryUsage.toFixed(2)}%`
                      : "N/A"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
        
        <!-- Spike Tests Section -->
        ${
          reportData.details.spike
            ? `
        <div class="test-section">
          <h3>Spike Tests</h3>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Recovery Time (s)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.details.spike
                .map(
                  (test: any) => `
                <tr>
                  <td>${test.name}</td>
                  <td class="status ${test.success ? "pass" : "fail"}">${
                    test.success ? "PASS" : "FAIL"
                  }</td>
                  <td>${
                    test.recovery && test.recovery.recoveryTimeSeconds > 0
                      ? test.recovery.recoveryTimeSeconds
                      : "N/A"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }
      </div>
      
      <script>
        // Chart initialization
        document.addEventListener('DOMContentLoaded', function() {
          // Pass Rate Chart
          const passRateData = {
            labels: ${JSON.stringify(Object.keys(reportData.summary.metrics))},
            datasets: [{
              label: 'Pass Rate (%)',
              data: ${JSON.stringify(
                Object.values(reportData.summary.metrics).map(
                  (m: any) => m.passRate || 0
                )
              )},
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: 'rgba(37, 99, 235, 1)',
              borderWidth: 1
            }]
          };
          
          const passRateCtx = document.getElementById('passRateChart').getContext('2d');
          new Chart(passRateCtx, {
            type: 'bar',
            data: passRateData,
            options: {
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Pass Rate (%)'
                  }
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: 'Pass Rate by Test Type',
                  font: {
                    size: 16
                  }
                }
              }
            }
          });
          
          // Response Time Chart (for frontend tests if available)
          ${
            reportData.details.frontend
              ? `
          const responseTimeData = {
            labels: ${JSON.stringify(
              reportData.details.frontend.map((t: any) => t.page)
            )},
            datasets: [
              {
                label: 'First Contentful Paint (FCP)',
                data: ${JSON.stringify(
                  reportData.details.frontend.map((t: any) =>
                    t.metrics
                      ? Math.round(t.metrics["First Contentful Paint (FCP)"])
                      : null
                  )
                )},
                backgroundColor: 'rgba(52, 211, 153, 0.7)',
                borderColor: 'rgba(52, 211, 153, 1)',
                borderWidth: 1
              },
              {
                label: 'Largest Contentful Paint (LCP)',
                data: ${JSON.stringify(
                  reportData.details.frontend.map((t: any) =>
                    t.metrics
                      ? Math.round(t.metrics["Largest Contentful Paint (LCP)"])
                      : null
                  )
                )},
                backgroundColor: 'rgba(14, 165, 233, 0.7)',
                borderColor: 'rgba(14, 165, 233, 1)',
                borderWidth: 1
              },
              {
                label: 'Time to Interactive (TTI)',
                data: ${JSON.stringify(
                  reportData.details.frontend.map((t: any) =>
                    t.metrics
                      ? Math.round(t.metrics["Time to Interactive (TTI)"])
                      : null
                  )
                )},
                backgroundColor: 'rgba(168, 85, 247, 0.7)',
                borderColor: 'rgba(168, 85, 247, 1)',
                borderWidth: 1
              }
            ]
          };
          
          const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
          new Chart(responseTimeCtx, {
            type: 'bar',
            data: responseTimeData,
            options: {
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Time (ms)'
                  }
                }
              },
              plugins: {
                title: {
                  display: true,
                  text: 'Core Web Vitals by Page',
                  font: {
                    size: 16
                  }
                }
              }
            }
          });
          `
              : ""
          }
        });
      </script>
    </body>
    </html>
  `;

  // Write HTML report
  const htmlReportPath = path.join(
    __dirname,
    "results",
    `performance-report-${timestamp}.html`
  );
  writeFileSync(htmlReportPath, htmlTemplate);

  // Generate PDF report if wkhtmltopdf is available
  try {
    const pdfReportPath = path.join(
      __dirname,
      "results",
      `performance-report-${timestamp}.pdf`
    );
    await execAsync(`wkhtmltopdf ${htmlReportPath} ${pdfReportPath}`);
    console.log(`PDF report generated at: ${pdfReportPath}`);
  } catch (error) {
    console.log("PDF report generation skipped - wkhtmltopdf not available");
  }

  console.log(`HTML report generated at: ${htmlReportPath}`);
}
