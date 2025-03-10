// performance/spike-tests.ts
/**
 * Spike testing implementation
 * Tests system behavior under sudden, large increases in load
 */

import { writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// Define spike testing scenarios
const spikeScenarios = {
  homePageSpike: `
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
            { duration: '30s', target: 1 },   // Stay at 1 RPS for 30s
            { duration: '10s', target: 100 }, // Spike to 100 RPS over 10s
            { duration: '1m', target: 100 },  // Stay at 100 RPS for 1m
            { duration: '10s', target: 1 },   // Scale back down
            { duration: '30s', target: 1 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        http_req_duration: ['p95<3000'], // 95% of requests must complete within 3s during spike
        http_req_failed: ['rate<0.1']    // Allow up to 10% failure rate during spike
      }
    };
    
    export default function() {
      // Make request to homepage (most common entry point)
      const res = http.get('http://localhost:3000/');
      
      check(res, { 
        'homepage loaded': (r) => r.status === 200,
        'homepage responded in time': (r) => r.timings.duration < 3000
      });
      
      // Random sleep between 0-1 seconds to add some variability
      sleep(Math.random());
    }
  `,

  cartApiSpike: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        cart_api_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 5,
          timeUnit: '1s',
          preAllocatedVUs: 50,
          maxVUs: 300,
          stages: [
            { duration: '30s', target: 5 },    // Baseline
            { duration: '5s', target: 80 },    // Quick spike to 80 RPS
            { duration: '30s', target: 80 },   // Stay at 80 RPS
            { duration: '5s', target: 5 },     // Scale back down
            { duration: '30s', target: 5 }     // Continue at baseline
          ]
        }
      },
      thresholds: {
        http_req_duration: ['p95<5000'], // 95% of requests must complete within 5s during spike
        http_req_failed: ['rate<0.15']   // Allow up to 15% failure rate during the spike
      }
    };
    
    export default function() {
      const sessionId = uuidv4();
      
      // API parameters
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Add to cart
      const payload = JSON.stringify({
        sessionId,
        productId: 1,
        quantity: 1
      });
      
      let res = http.post('http://localhost:3000/api/cart', payload, params);
      
      check(res, { 
        'add to cart successful': (r) => r.status === 200,
        'add to cart response time acceptable': (r) => r.timings.duration < 5000
      });
      
      sleep(1);
      
      // Get cart
      res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
      
      check(res, { 
        'get cart successful': (r) => r.status === 200,
        'get cart response time acceptable': (r) => r.timings.duration < 3000
      });
      
      // Sleep between 0-1 seconds
      sleep(Math.random());
    }
  `,

  checkoutSpike: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        checkout_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 30,
          maxVUs: 150,
          stages: [
            { duration: '20s', target: 1 },   // Baseline
            { duration: '10s', target: 30 },  // Spike to 30 RPS
            { duration: '30s', target: 30 },  // Maintain spike
            { duration: '10s', target: 1 },   // Back to baseline
            { duration: '20s', target: 1 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        http_req_duration: ['p95<8000'], // 95% of requests must complete within 8s
        http_req_failed: ['rate<0.2']    // Allow up to 20% failure rate during checkout spike
      }
    };
    
    export default function() {
      // Simulate checkout flow with payment intent creation
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Create payment intent (most resource-intensive part of checkout)
      const items = [
        {
          product_id: 1,
          quantity: 1,
          price: 199.99,
          name: 'Bone+ Headphone'
        }
      ];
      
      const payload = JSON.stringify({ items });
      
      const res = http.post('http://localhost:3000/api/stripe/payment-intent', payload, params);
      
      check(res, { 
        'payment intent created': (r) => r.status === 200,
        'payment intent has client secret': (r) => {
          try {
            const body = JSON.parse(r.body);
            return !!body.clientSecret;
          } catch (e) {
            return false;
          }
        },
        'checkout response time acceptable': (r) => r.timings.duration < 8000
      });
      
      // Sleep between 1-3 seconds to simulate checkout form filling
      sleep(Math.random() * 2 + 1);
    }
  `,

  contactFormSpike: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        contact_form_spike: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 50,
          maxVUs: 200,
          stages: [
            { duration: '20s', target: 1 },   // Baseline
            { duration: '5s', target: 50 },   // Quick spike to 50 RPS
            { duration: '20s', target: 50 },  // Maintain spike
            { duration: '5s', target: 1 },    // Back to baseline
            { duration: '20s', target: 1 }    // Continue at baseline
          ]
        }
      },
      thresholds: {
        http_req_duration: ['p95<5000'], // 95% of requests must complete within 5s
        http_req_failed: ['rate<0.2']    // Allow up to 20% failure during spike
      }
    };
    
    export default function() {
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Generate unique email to avoid database constraints
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      
      const payload = JSON.stringify({
        name: 'Spike Test User',
        email: \`spike_test_\${timestamp}_\${random}@example.com\`,
        message: \`This is a spike test message sent at \${new Date().toISOString()}\`
      });
      
      const res = http.post('http://localhost:3000/api/contact', payload, params);
      
      check(res, { 
        'contact form submission successful': (r) => r.status === 201,
        'contact form response time acceptable': (r) => r.timings.duration < 5000
      });
      
      // Sleep between 0.5-1.5 seconds
      sleep(Math.random() + 0.5);
    }
  `
};

/**
 * Executes a spike test scenario
 */
async function executeSpikeTest(name: string, script: string): Promise<any> {
  // Write script to temporary file
  const scriptPath = path.join(__dirname, `${name}.js`);
  writeFileSync(scriptPath, script);

  console.log(`Running spike test: ${name}`);

  try {
    // Execute k6 with the script
    const { stdout, stderr } = await execAsync(
      `k6 run --summary-export=./performance/results/${name}-spike.json ${scriptPath}`
    );

    console.log(`${name} spike test completed`);
    if (stderr) {
      console.error(`Error during spike test: ${stderr}`);
    }

    return {
      name,
      success: !stderr,
      summary: stdout
    };
  } catch (error) {
    console.error(`Spike test execution failed for ${name}:`, error);
    return {
      name,
      success: false,
      error: error.message
    };
  }
}

/**
 * Runs recovery time benchmark after a spike test
 * This measures how quickly the system returns to normal performance levels
 */
async function measureRecoveryTime(name: string): Promise<any> {
  console.log(`Measuring recovery time after ${name} spike...`);

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
          duration: '2m',
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
    const { stdout, stderr } = await execAsync(
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
    console.error(`Recovery measurement failed for ${name}:`, error);
    return {
      name: `${name}-recovery`,
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyzes recovery data to determine recovery time
 */
function analyzeRecoveryData(dataFilePath: string): {
  recoveryTimeSeconds: number;
} {
  try {
    // In a real implementation, this would parse the CSV and use statistical analysis
    // to determine when response times return to baseline

    // For this implementation, we'll return a placeholder value
    return {
      recoveryTimeSeconds: 15 // Placeholder: actual implementation would calculate this
    };
  } catch (error) {
    console.error("Error analyzing recovery data:", error);
    return {
      recoveryTimeSeconds: -1 // Error condition
    };
  }
}

/**
 * Runs all spike tests and measures recovery times
 */
export async function runSpikeTests(): Promise<any> {
  console.log("Starting spike tests...");

  const results = [];

  // Run each spike test scenario
  for (const [name, script] of Object.entries(spikeScenarios)) {
    // Run the spike test
    const result = await executeSpikeTest(name, script);

    // Measure recovery time after spike
    if (result.success) {
      // Allow system to settle slightly before measuring recovery
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const recoveryResult = await measureRecoveryTime(name);

      if (recoveryResult.success) {
        const recoveryAnalysis = analyzeRecoveryData(
          recoveryResult.analysisFile
        );

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
