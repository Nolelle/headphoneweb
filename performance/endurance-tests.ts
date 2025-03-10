// performance/endurance-tests.ts
/**
 * Endurance testing implementation
 * Tests system behavior under sustained load over extended periods
 */

import { writeFileSync } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

// Define endurance test scenarios
const enduranceScenarios = {
  sustainedBrowsing: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        sustained_browsing: {
          executor: 'constant-vus',
          vus: 20,              // 20 virtual users
          duration: '30m',      // Run for 30 minutes in real tests (reduced for development)
          gracefulStop: '1m'
        }
      },
      thresholds: {
        http_req_duration: ['p95<1000', 'p99<3000'],
        http_req_failed: ['rate<0.01']
      }
    };
    
    export default function() {
      // Random sleep between requests to simulate real user behavior
      const randomSleep = Math.random() * 3 + 1; // 1-4 seconds
      
      // Homepage
      let res = http.get('http://localhost:3000/');
      check(res, { 'homepage status is 200': (r) => r.status === 200 });
      sleep(randomSleep);
      
      // Product section (simulating scrolling)
      if (Math.random() > 0.5) { // 50% chance to scroll to product
        res = http.get('http://localhost:3000/#headphone');
        check(res, { 'product section status is 200': (r) => r.status === 200 });
        sleep(randomSleep * 2); // Spend more time looking at product
      }
      
      // About Us section
      if (Math.random() > 0.7) { // 30% chance to view About Us
        res = http.get('http://localhost:3000/#about');
        check(res, { 'about section status is 200': (r) => r.status === 200 });
        sleep(randomSleep);
      }
      
      // Contact section
      if (Math.random() > 0.8) { // 20% chance to view Contact
        res = http.get('http://localhost:3000/#contact');
        check(res, { 'contact section status is 200': (r) => r.status === 200 });
        sleep(randomSleep * 1.5);
      }
      
      // Final sleep to simulate time between sessions
      sleep(randomSleep);
    }
  `,

  cartSessionPersistence: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
    
    export const options = {
      scenarios: {
        cart_persistence: {
          executor: 'constant-vus',
          vus: 10,               // 10 virtual users
          duration: '15m',       // Run for 15 minutes in real tests (reduced for development)
          gracefulStop: '30s'
        }
      },
      thresholds: {
        http_req_duration: ['p95<2000', 'avg<1000'],
        http_req_failed: ['rate<0.05']
      }
    };
    
    export default function() {
      // Generate a persistent session ID for this VU
      // This ensures the same "user" keeps using the same cart across the test
      const sessionId = __VU + '-' + uuidv4().substring(0, 8);
      
      const params = {
        headers: {
          'Content-Type': 'application/json',
        },
      };
      
      // First check if cart already has items (for subsequent iterations)
      let res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
      
      // If this is the first run or cart is empty, add an item
      const cartData = JSON.parse(res.body);
      if (!cartData.items || cartData.items.length === 0) {
        // Add product to cart
        const payload = JSON.stringify({
          sessionId: sessionId,
          productId: 1,
          quantity: 1
        });
        
        res = http.post('http://localhost:3000/api/cart', payload, params);
        check(res, { 'add to cart succeeded': (r) => r.status === 200 });
      } else {
        // Randomly update quantity
        if (Math.random() > 0.5 && cartData.items.length > 0) {
          const item = cartData.items[0];
          const newQuantity = item.quantity < 5 ? item.quantity + 1 : item.quantity - 1;
          
          const updatePayload = JSON.stringify({
            sessionId: sessionId,
            cartItemId: item.cart_item_id,
            quantity: newQuantity
          });
          
          res = http.put('http://localhost:3000/api/cart/update', updatePayload, params);
          check(res, { 'cart update succeeded': (r) => r.status === 200 });
        }
      }
      
      // Simulate time passing (a longer sleep to test session persistence)
      sleep(Math.random() * 30 + 30); // 30-60 seconds
      
      // Check cart again to verify persistence
      res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
      check(res, { 
        'cart retrieval succeeded': (r) => r.status === 200,
        'cart data persisted': (r) => {
          const data = JSON.parse(r.body);
          return data.items && data.items.length > 0;
        }
      });
      
      // Final sleep
      sleep(5);
    }
  `,

  databaseConnectionPoolStability: `
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        db_connection_stability: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '5m', target: 30 },  // Ramp up to 30 users over 5 min
            { duration: '20m', target: 30 }, // Stay at 30 users for 20 min
            { duration: '5m', target: 0 }    // Ramp down over 5 min
          ],
          gracefulStop: '30s'
        }
      },
      thresholds: {
        http_req_duration: ['p95<2000', 'avg<1000'],
        http_req_failed: ['rate<0.05']
      }
    };
    
    export default function() {
      // Make different database-intensive API calls to test connection pool
      
      // 1. Cart operations (uses DB)
      const sessionId = \`endurance-\${__VU}-\${__ITER}\`;
      
      // Get cart
      let res = http.get(\`http://localhost:3000/api/cart?sessionId=\${sessionId}\`);
      check(res, { 'cart get succeeded': (r) => r.status === 200 });
      
      sleep(2);
      
      // 2. Contact form messages (DB query)
      if (Math.random() > 0.7) { // 30% chance
        const payload = JSON.stringify({
          name: 'Endurance Test User',
          email: \`endurance_\${Date.now()}_\${__VU}@example.com\`,
          message: \`Endurance test message \${__ITER} from VU \${__VU}\`
        });
        
        res = http.post('http://localhost:3000/api/contact', payload, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        check(res, { 'contact form post succeeded': (r) => r.status === 201 });
      }
      
      sleep(2);
      
      // 3. Product stock check (DB query)
      res = http.post('http://localhost:3000/api/products/check-stock', 
        JSON.stringify({ id: 1, quantity: 1 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      check(res, { 'stock check succeeded': (r) => r.status === 200 });
      
      // Random sleep to simulate user thinking
      sleep(Math.random() * 5 + 3); // 3-8 seconds
    }
  `
};

/**
 * System metrics collection for endurance testing
 */
async function collectSystemMetrics(): Promise<Record<string, any>> {
  try {
    const metrics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      cpu: {},
      memory: {},
      system: {}
    };

    // Get CPU info
    const cpuInfo = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpuInfo.forEach((cpu) => {
      totalIdle += cpu.times.idle;
      totalTick +=
        cpu.times.user +
        cpu.times.nice +
        cpu.times.sys +
        cpu.times.idle +
        cpu.times.irq;
    });

    metrics.cpu.usage = 100 - (totalIdle / totalTick) * 100;
    metrics.cpu.count = cpuInfo.length;

    // Get memory info
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    metrics.memory.total = totalMem;
    metrics.memory.free = freeMem;
    metrics.memory.used = usedMem;
    metrics.memory.usagePercent = (usedMem / totalMem) * 100;

    // Get load average (not available on Windows)
    try {
      metrics.system.loadAvg = os.loadavg();
    } catch (e) {
      metrics.system.loadAvg = [0, 0, 0]; // Default for Windows
    }

    // Get uptime
    metrics.system.uptime = os.uptime();

    return metrics;
  } catch (error) {
    console.error("Error collecting system metrics:", error);
    return { error: error.message };
  }
}

/**
 * Monitors Node.js process metrics
 */
async function monitorNodeProcess(): Promise<Record<string, any>> {
  try {
    // Execute ps command to get Node.js process info
    const { stdout } = await execAsync(
      "ps -eo pid,ppid,%cpu,%mem,cmd | grep 'node' | grep -v grep"
    );

    const processes = stdout
      .trim()
      .split("\n")
      .map((line) => {
        const parts = line.trim().split(/\s+/);

        return {
          pid: parseInt(parts[0], 10),
          ppid: parseInt(parts[1], 10),
          cpu: parseFloat(parts[2]),
          memory: parseFloat(parts[3]),
          command: parts.slice(4).join(" ")
        };
      });

    return { timestamp: new Date().toISOString(), processes };
  } catch (error) {
    console.error("Error monitoring Node.js process:", error);
    return { error: error.message };
  }
}

/**
 * Executes an endurance test scenario
 */
async function executeEnduranceTest(
  name: string,
  script: string,
  duration: string = "10m"
): Promise<any> {
  // Write script to temp file
  const scriptPath = path.join(__dirname, `${name}.js`);
  writeFileSync(scriptPath, script);

  // Prepare for metrics collection
  const metricsInterval = 30000; // 30 seconds
  const metricsData: Array<Record<string, any>> = [];
  const processData: Array<Record<string, any>> = [];

  console.log(`Starting endurance test: ${name} (${duration})`);

  // Start metrics collection
  const metricsCollector = setInterval(async () => {
    const metrics = await collectSystemMetrics();
    metricsData.push(metrics);

    const processMetrics = await monitorNodeProcess();
    processData.push(processMetrics);
  }, metricsInterval);

  try {
    // Execute k6 with the script
    const { stdout, stderr } = await execAsync(
      `k6 run --summary-export=./performance/results/${name}.json ${scriptPath}`
    );

    console.log(`${name} test completed`);
    if (stderr) {
      console.error(`Error during test: ${stderr}`);
    }

    // Save metrics data
    writeFileSync(
      path.join(__dirname, "results", `${name}-system-metrics.json`),
      JSON.stringify(metricsData, null, 2)
    );

    writeFileSync(
      path.join(__dirname, "results", `${name}-process-metrics.json`),
      JSON.stringify(processData, null, 2)
    );

    return {
      name,
      success: !stderr,
      summary: stdout,
      systemMetrics: {
        count: metricsData.length,
        averageCpuUsage:
          metricsData.reduce((sum, m) => sum + m.cpu?.usage || 0, 0) /
          metricsData.length,
        averageMemoryUsage:
          metricsData.reduce((sum, m) => sum + m.memory?.usagePercent || 0, 0) /
          metricsData.length
      }
    };
  } catch (error) {
    console.error(`Test execution failed for ${name}:`, error);
    return {
      name,
      success: false,
      error: error.message
    };
  } finally {
    // Stop metrics collection
    clearInterval(metricsCollector);
  }
}

/**
 * Runs all endurance tests
 */
export async function runEnduranceTests(): Promise<any> {
  console.log("Starting endurance tests...");

  // Override duration for dev/testing purposes
  // Set to shorter times for testing, longer for actual endurance tests
  const testDuration = process.env.NODE_ENV === "production" ? "30m" : "2m";

  const results = [];

  // Run each endurance test scenario
  for (const [name, script] of Object.entries(enduranceScenarios)) {
    const result = await executeEnduranceTest(name, script, testDuration);
    results.push(result);
  }

  return results;
}
