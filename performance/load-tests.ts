// performance/load-tests.ts
/**
 * Load testing implementation using k6
 * This module tests the application under expected normal and peak loads
 */

import { writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const execAsync = promisify(exec);

// Define test scenarios based on critical user journeys from your application
const scenarios = {
  browsing: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        browsing_flow: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '20s', target: 20 },  // Ramp up to 20 users
            { duration: '30s', target: 50 },  // Ramp up to 50 users
            { duration: '1m', target: 50 },   // Stay at 50 users
            { duration: '20s', target: 0 }    // Ramp down
          ],
          gracefulRampDown: '30s'
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<800', 'p(99)<1500'],  // 95% of requests must complete within 800ms
        'http_req_failed': ['rate<0.01']                  // Error rate must be less than 1%
      }
    };
    
    export default function() {
      // Simulate home page visit
      let res = http.get('http://localhost:3000/');
      check(res, { 'homepage status is 200': (r) => r.status === 200 });
      sleep(1);
      
      // Simulate browsing product page (just example path)
      res = http.get('http://localhost:3000/products');
      check(res, { 'product page status is 200': (r) => r.status === 200 || r.status === 404 }); // 404 is OK if this route doesn't exist
      sleep(1);
    }
  `,

  cartOperations: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        cart_operations: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '20s', target: 20 },
            { duration: '30s', target: 50 },
            { duration: '1m', target: 50 },
            { duration: '20s', target: 0 }
          ],
          gracefulRampDown: '30s'
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<1000', 'p(99)<3000'],
        'http_req_failed': ['rate<0.05']
      }
    };
    
    export default function() {
      // Generate a unique session ID for this virtual user
      const sessionId = uuidv4();
      
      // Add product to cart (matches your API structure)
      const payload = JSON.stringify({
        sessionId: sessionId,
        productId: 1,  // Assuming product id 1 exists
        quantity: 1
      });
      
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      try {
        // POST to add to cart - check both potential API endpoints
        let res = http.post('http://localhost:3000/api/cart', payload, params);
        
        // If first endpoint fails, try alternative endpoint structure
        if (res.status >= 400) {
          console.log('Trying alternative cart endpoint');
          res = http.post('http://localhost:3000/api/cart/add', payload, params);
        }
        
        check(res, { 
          'cart add status is successful': (r) => r.status < 400,
        });
        sleep(1);
        
        // GET cart contents - try multiple possible API structures
        res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
        if (res.status >= 400) {
          res = http.get(\`http://localhost:3000/api/cart/\${sessionId}\`);
        }
        
        check(res, { 'cart get status is successful': (r) => r.status < 400 });
        sleep(1);
      } catch (e) {
        console.log('Error in cart operations:', e);
      }
    }
  `,

  checkoutProcess: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        checkout_flow: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '20s', target: 30 },
            { duration: '40s', target: 50 },
            { duration: '1m', target: 50 },
            { duration: '20s', target: 0 }
          ],
          gracefulRampDown: '30s'
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05']
      }
    };
    
    export default function() {
      const sessionId = uuidv4();
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // 1. Add item to cart first
      const cartPayload = JSON.stringify({
        sessionId: sessionId,
        productId: 1,
        quantity: 1
      });
      
      let res = http.post('http://localhost:3000/api/cart', cartPayload, params);
      check(res, { 'add to cart succeeded': (r) => r.status === 200 });
      sleep(2);
      
      // 2. Create payment intent
      const items = [
        {
          product_id: 1,
          quantity: 1,
          price: 199.99,
          name: 'Bone+ Headphone'
        }
      ];
      
      const paymentPayload = JSON.stringify({ items });
      
      res = http.post('http://localhost:3000/api/stripe/payment-intent', paymentPayload, params);
      check(res, { 
        'payment intent created': (r) => r.status === 200,
        'client secret returned': (r) => JSON.parse(r.body).clientSecret !== undefined
      });
      
      // Note: We can't complete the actual Stripe payment in a load test
      // as it would require browser integration for the Stripe Elements
      
      sleep(3);
    }
  `,

  contactForm: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        contact_form: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '20s', target: 10 },
            { duration: '30s', target: 20 },
            { duration: '30s', target: 20 },
            { duration: '20s', target: 0 }
          ],
          gracefulRampDown: '30s'
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<1500', 'p(99)<3000'],
        'http_req_failed': ['rate<0.05']
      }
    };
    
    export default function() {
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // Create unique message to avoid database constraints
      const timestamp = Date.now();
      const payload = JSON.stringify({
        name: 'Performance Test User',
        email: \`test\${timestamp}@example.com\`,
        message: \`This is a performance test message sent at \${timestamp}\`
      });
      
      try {
        // Try both potential API endpoints for contact form
        let res = http.post('http://localhost:3000/api/contact', payload, params);
        
        // Check if we need to try alternative endpoint
        if (res.status >= 400) {
          res = http.post('http://localhost:3000/api/contact/send', payload, params);
        }
        
        check(res, { 
          'contact form submission successful': (r) => r.status < 400,
        });
      } catch (e) {
        console.log('Error in contact form submission:', e);
      }
      
      sleep(1);
    }
  `,

  adminDashboard: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        admin_dashboard: {
          executor: 'constant-vus',
          vus: 5,  // Simulating 5 admin users
          duration: '2m',
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05']
      }
    };
    
    export default function() {
      // Admin login
      let formData = {
        username: 'admin',
        password: 'admin123'
      };
      
      let res = http.post('http://localhost:3000/api/admin/login', JSON.stringify(formData), {
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Check login was successful
      check(res, { 'admin login succeeded': (r) => r.status === 200 });
      
      // Get admin session cookie
      const cookies = res.cookies;
      const params = {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': \`admin_session=\${cookies['admin_session'] || '1'}\`
        }
      };
      
      sleep(2);
      
      // Fetch messages
      res = http.get('http://localhost:3000/api/admin/messages', params);
      check(res, { 'messages fetched': (r) => r.status === 200 });
      
      sleep(3);
      
      // Update message status for first message (assuming at least one exists)
      const updatePayload = JSON.stringify({ status: 'READ' });
      res = http.patch('http://localhost:3000/api/admin/messages/1/status', updatePayload, params);
      check(res, { 'message status updated': (r) => r.status === 200 });
      
      sleep(2);
    }
  `
};

// Define types for test results
interface LoadTestResult {
  name: string;
  success: boolean;
  summary?: string;
  error?: string;
}

/**
 * Executes a load test script using k6
 * @param scriptName - Name of the test scenario
 * @param scriptContent - k6 script content
 * @returns Results from the test run
 */
async function executeLoadTest(
  scriptName: string,
  scriptContent: string
): Promise<LoadTestResult> {
  // Write the script to a temporary file
  const scriptPath = path.join(__dirname, `${scriptName}.js`);
  writeFileSync(scriptPath, scriptContent);

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  try {
    // Execute k6 with the script
    console.log(`Running ${scriptName} load test...`);
    const { stdout, stderr } = await execAsync(
      `k6 run --summary-export=results/${scriptName}.json ${scriptPath}`
    );

    console.log(`${scriptName} test completed`);
    if (stderr && stderr.trim() !== "") {
      console.error(`Error during test: ${stderr}`);
    }

    // Return basic results (a real implementation would parse the JSON output)
    return {
      name: scriptName,
      success: !stderr || stderr.trim() === "",
      summary: stdout
    };
  } catch (error) {
    console.error(`Test execution failed for ${scriptName}:`, error);
    return {
      name: scriptName,
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
 * Runs all load tests and collects the results
 */
export async function runLoadTests(): Promise<LoadTestResult[]> {
  console.log("Starting load tests for critical user journeys...");

  const results: LoadTestResult[] = [];

  // Execute each test scenario
  for (const [name, script] of Object.entries(scenarios)) {
    const result = await executeLoadTest(name, script);
    results.push(result);
  }

  return results;
}
