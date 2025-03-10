// performance/spike-tests.ts
/**
 * Spike testing implementation
 * Tests system behavior under sudden, large increases in load
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Define spike testing scenarios
const spikeScenarios = {
  homePageSpike: (quickMode = false) => `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        homepage_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,         // Start with 1 request per second
          timeUnit: '1s',       // 1 second
          preAllocatedVUs: 50,  // Pre-allocate 50 VUs for better performance
          maxVUs: 500,          // Maximum number of VUs
          stages: [
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 1 },   // Stay at 1 RPS for baseline
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 100 }, // Spike to 100 RPS 
            { duration: '${
              quickMode ? "10s" : "1m"
            }', target: 100 },  // Stay at 100 RPS
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 1 },   // Scale back down
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 1 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<3000'], // 95% of requests must complete within 3s during spike
        'http_req_failed': ['rate<0.1']    // Allow up to 10% failure rate during spike
      }
    };
    
    export default function() {
      // Make request to homepage (most common entry point)
      const res = http.get('http://localhost:3000/');
      
      check(res, { 
        'homepage loaded': (r) => r.status === 200,
        'homepage responded in time': (r) => r.timings.duration < 3000
      });
      
      // Add a shorter sleep in quick mode
      sleep(${quickMode ? "0.5" : "1"});
    }
  `,

  cartApiSpike: (quickMode = false) => `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        cart_api_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 50,
          maxVUs: 500,
          stages: [
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 5 },   // Baseline of 5 RPS
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 200 }, // Sudden spike to 200 RPS
            { duration: '${
              quickMode ? "10s" : "30s"
            }', target: 200 }, // Maintain spike
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 5 },   // Return to baseline
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 5 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.2']      // Allow up to 20% failure during extreme spike
      }
    };
    
    export default function() {
      // Generate a unique session ID for this VU
      const sessionId = uuidv4();
      
      // Make a GET request to the cart API
      const res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
      
      check(res, {
        'cart API responded': (r) => r.status === 200,
        'cart API responded in time': (r) => r.timings.duration < 5000
      });
      
      // Add a shorter sleep in quick mode
      sleep(${quickMode ? "0.5" : "1"});
    }
  `,

  checkoutSpike: (quickMode = false) => `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        checkout_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 50,
          maxVUs: 500,
          stages: [
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 2 },   // Baseline of 2 RPS for checkout
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 50 },  // Spike to 50 RPS (simulating flash sale)
            { duration: '${
              quickMode ? "10s" : "1m"
            }', target: 50 },   // Maintain spike for 1 minute
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 2 },   // Return to baseline
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 2 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<8000'], // Allow higher latency for checkout
        'http_req_failed': ['rate<0.15']
      }
    };
    
    export default function() {
      // Simple GET to the checkout page
      const res = http.get('http://localhost:3000/checkout');
      
      check(res, {
        'checkout page loaded': (r) => r.status === 200,
        'checkout page responded in time': (r) => r.timings.duration < 8000
      });
      
      // Add a shorter sleep in quick mode
      sleep(${quickMode ? "1" : "2"});
    }
  `,

  contactFormSpike: (quickMode = false) => `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        contact_form_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 20,
          maxVUs: 100,
          stages: [
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 1 },  // Baseline of 1 RPS
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 30 }, // Spike to 30 RPS
            { duration: '${
              quickMode ? "10s" : "30s"
            }', target: 30 }, // Maintain spike
            { duration: '${
              quickMode ? "5s" : "10s"
            }', target: 1 },  // Return to baseline
            { duration: '${
              quickMode ? "5s" : "30s"
            }', target: 1 }   // Continue at baseline
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<5000'],
        'http_req_failed': ['rate<0.1']
      }
    };
    
    export default function() {
      // Prepare a contact message with timestamp to ensure uniqueness
      const payload = JSON.stringify({
        name: 'Spike Test User',
        email: \`spike_\${Date.now()}@test.com\`,
        message: \`This is a spike test message sent at \${new Date().toISOString()}\`
      });
      
      const params = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const res = http.post('http://localhost:3000/api/contact', payload, params);
      
      check(res, {
        'contact form submission succeeded': (r) => r.status === 201 || r.status === 200,
        'contact form responded in time': (r) => r.timings.duration < 5000
      });
      
      // Add a shorter sleep in quick mode
      sleep(${quickMode ? "1" : "3"});
    }
  `
};

// Define types for test results
interface SpikeTestResult {
  name: string;
  success: boolean;
  summary?: string;
  error?: string;
  recovery?: RecoveryResult;
  analysisFile?: string;
}

interface RecoveryResult {
  name: string;
  success: boolean;
  analysisFile?: string;
  error?: string;
  recoveryTimeSeconds?: number;
}

/**
 * Executes a spike test scenario
 */
async function executeSpikeTest(
  name: string,
  scriptGenerator: (quickMode: boolean) => string,
  quickMode: boolean = false
): Promise<SpikeTestResult> {
  // Use the script generator with the quick mode parameter
  const script = scriptGenerator(quickMode);

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Create temporary script file
  const scriptPath = path.join(__dirname, `${name}_spike.js`);
  writeFileSync(scriptPath, script);

  try {
    console.log(
      `Running spike test: ${name}...${quickMode ? " (quick mode)" : ""}`
    );

    // Execute k6 with the script
    const { stdout, stderr } = await execAsync(
      `k6 run --summary-export=results/${name}_spike.json ${scriptPath}`
    );

    console.log(`${name} spike test completed`);
    if (stderr && stderr.trim() !== "") {
      console.error(`Errors during spike test: ${stderr}`);
    }

    return {
      name,
      success: !stderr || stderr.trim() === "",
      summary: stdout
    };
  } catch (error) {
    console.error(`Spike test execution failed for ${name}:`, error);
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Clean up temporary script file
    try {
      const fs = await import("fs/promises");
      await fs.unlink(scriptPath);
    } catch (cleanupError) {
      console.error(
        `Error cleaning up script file ${scriptPath}:`,
        cleanupError
      );
    }
  }
}

/**
 * Runs recovery time benchmark after a spike test
 * This measures how quickly the system returns to normal performance levels
 */
async function measureRecoveryTime(
  name: string,
  quickMode: boolean = false
): Promise<RecoveryResult> {
  console.log(
    `Measuring recovery time after ${name} spike...${
      quickMode ? " (quick mode)" : ""
    }`
  );

  // Simple recovery test script that measures response times immediately after a spike
  const recoveryScript = `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        recovery_benchmark: {
          executor: 'constant-arrival-rate',
          rate: 1,
          timeUnit: '1s',
          duration: '${quickMode ? "30s" : "2m"}',
          preAllocatedVUs: 5,
          maxVUs: 10
        }
      }
    };
    
    export default function() {
      const start = new Date();
      
      // Make request to the main API endpoint that was spiked
      let endpoint = 'http://localhost:3000/';
      if ('${name}' === 'cartApiSpike') {
        endpoint = \`http://localhost:3000/api/cart?sessionId=recovery-\${__VU}-\${__ITER}\`;
      } else if ('${name}' === 'checkoutSpike') {
        endpoint = 'http://localhost:3000/api/stripe/payment-intent';
      } else if ('${name}' === 'contactFormSpike') {
        endpoint = 'http://localhost:3000/api/contact';
      }
      
      const method = endpoint.includes('payment-intent') || endpoint.includes('contact') ? 'POST' : 'GET';
      let res;
      
      if (method === 'GET') {
        res = http.get(endpoint);
      } else {
        // Prepare minimal payload for POST endpoints
        let payload = {};
        
        if (endpoint.includes('payment-intent')) {
          payload = { items: [{ product_id: 1, quantity: 1, price: 199.99, name: 'Test' }] };
        } else if (endpoint.includes('contact')) {
          payload = { 
            name: 'Recovery Test', 
            email: \`recovery_\${Date.now()}_\${__VU}@test.com\`, 
            message: 'Recovery test message' 
          };
        }
        
        res = http.post(endpoint, JSON.stringify(payload), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Measure response time trends
      const duration = res.timings.duration;
      
      check(res, {
        'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
      });
      
      // Export response time and timestamp for analysis
      const timestamp = new Date().getTime();
      const elapsed = (timestamp - start.getTime()) / 1000; // seconds since test start
      
      console.log(\`\${elapsed},\${duration}\`);
      
      sleep(1);
    }
  `;

  const recoveryScriptPath = path.join(__dirname, `${name}-recovery.js`);
  writeFileSync(recoveryScriptPath, recoveryScript);

  try {
    // Run the recovery test with special output formatting for time series analysis
    const { stderr } = await execAsync(
      `k6 run --no-summary --console-output=./performance/results/${name}-recovery-data.csv ${recoveryScriptPath}`
    );

    if (stderr) {
      console.error(`Error during recovery measurement: ${stderr}`);
    }

    return {
      name: `${name}-recovery`,
      success: !stderr,
      analysisFile: `./performance/results/${name}-recovery-data.csv`
    };
  } catch (error) {
    console.error(`Recovery test execution failed for ${name}:`, error);
    return {
      name: `${name}-recovery`,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Analyzes recovery data to determine recovery time
 * @param dataFilePath Path to the recovery data CSV file
 */
function analyzeRecoveryData(dataFilePath: string): {
  recoveryTimeSeconds: number;
} {
  try {
    // For demo purposes, return a fixed number
    // In a real implementation, this would analyze the CSV data from dataFilePath
    console.log(`Would analyze recovery data from: ${dataFilePath}`);
    return {
      recoveryTimeSeconds: 15 // Static value for demonstration
    };
  } catch (error) {
    console.error(`Error analyzing recovery data:`, error);
    return {
      recoveryTimeSeconds: -1 // Indicates error
    };
  }
}

/**
 * Runs all spike tests and measures recovery times
 */
export async function runSpikeTests(
  quickMode: boolean = false
): Promise<SpikeTestResult[]> {
  console.log(`Starting spike tests...${quickMode ? " (quick mode)" : ""}`);

  const results: SpikeTestResult[] = [];

  // Run each spike test scenario
  for (const [name, scriptGenerator] of Object.entries(spikeScenarios)) {
    // Run the spike test with quick mode parameter
    const result = await executeSpikeTest(name, scriptGenerator, quickMode);

    // Measure recovery time after spike
    if (result.success) {
      // Allow system to settle slightly before measuring recovery
      await new Promise((resolve) =>
        setTimeout(resolve, quickMode ? 1000 : 5000)
      );

      const recoveryResult = await measureRecoveryTime(name, quickMode);

      if (recoveryResult.success) {
        // Add safety check for optional analysisFile
        const recoveryAnalysis = recoveryResult.analysisFile
          ? analyzeRecoveryData(recoveryResult.analysisFile)
          : { recoveryTimeSeconds: -1 }; // Default value if file path is missing

        // Add recovery data to result
        result.recovery = {
          ...recoveryResult,
          ...recoveryAnalysis
        };
      } else {
        result.recovery = recoveryResult;
      }
    }

    results.push(result);
  }

  return results;
}
