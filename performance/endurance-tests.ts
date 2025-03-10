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
import { existsSync, mkdirSync } from "fs";

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
        'http_req_duration': ['p(95)<1000', 'p(99)<3000'],
        'http_req_failed': ['rate<0.01']
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
          executor: 'per-vu-iterations',
          vus: 10,
          iterations: 20,    // Each VU executes 20 iterations
          maxDuration: '30m' // Maximum duration of the test
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05']
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
        db_connection_pool: {
          executor: 'ramping-arrival-rate',
          startRate: 1,
          timeUnit: '1s',
          preAllocatedVUs: 10,
          maxVUs: 50,
          stages: [
            { duration: '1m', target: 10 },  // Ramp up to 10 requests per second
            { duration: '15m', target: 10 }, // Stay at 10 rps for 15 minutes
            { duration: '1m', target: 0 }    // Ramp down
          ]
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
        'http_req_failed': ['rate<0.05']
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

// Define types for metrics and results
interface SystemMetrics {
  timestamp: string;
  cpuLoad: number;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    usedMemPercentage: number;
  };
  system?: {
    uptime: number;
    loadAvg: number[];
  };
  error?: string;
}

interface NodeProcessMetrics {
  pid?: number;
  cpu?: number;
  memory?: number;
  error?: string;
}

interface EnduranceTestResult {
  name: string;
  success: boolean;
  summary?: string;
  error?: string;
  systemMetrics?: {
    samples: number;
    maxCpuLoad: number;
    avgCpuLoad: number;
    maxMemUsage: number;
    avgMemUsage: number;
  };
}

/**
 * System metrics collection for endurance testing
 */
async function collectSystemMetrics(): Promise<SystemMetrics> {
  try {
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      cpuLoad: 0,
      memoryUsage: {
        total: 0,
        free: 0,
        used: 0,
        usedMemPercentage: 0
      }
    };

    // Get CPU usage
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    // Calculate CPU load as percentage
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    metrics.cpuLoad = 100 - (idle / total) * 100;

    // Get memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    metrics.memoryUsage = {
      total: totalMem,
      free: freeMem,
      used: usedMem,
      usedMemPercentage: (usedMem / totalMem) * 100
    };

    // System info
    metrics.system = {
      uptime: os.uptime(),
      loadAvg: [0, 0, 0]
    };

    try {
      metrics.system.loadAvg = os.loadavg();
    } catch {
      // Fallback for platforms where loadavg might not be available (like Windows)
      metrics.system.loadAvg = [0, 0, 0]; // Default for Windows
    }

    return metrics;
  } catch (error) {
    console.error("Error collecting system metrics:", error);
    return {
      timestamp: new Date().toISOString(),
      cpuLoad: 0,
      memoryUsage: {
        total: 0,
        free: 0,
        used: 0,
        usedMemPercentage: 0
      },
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Monitors Node.js process metrics
 */
async function monitorNodeProcess(): Promise<NodeProcessMetrics> {
  try {
    // Execute ps command to get Node.js process info
    const { stdout } = await execAsync(
      "ps -p " + process.pid + " -o %cpu,%mem"
    );

    // Parse output
    const lines = stdout.trim().split("\n");
    if (lines.length < 2) {
      return { pid: process.pid };
    }

    const values = lines[1].trim().split(/\s+/);
    return {
      pid: process.pid,
      cpu: parseFloat(values[0]),
      memory: parseFloat(values[1])
    };
  } catch (error) {
    console.error("Error monitoring Node.js process:", error);
    return {
      pid: process.pid,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Executes an endurance test
 */
async function executeEnduranceTest(
  name: string,
  script: string,
  duration: string = "10m"
): Promise<EnduranceTestResult> {
  // Create temporary script file
  const scriptPath = path.join(__dirname, `${name}_endurance.js`);
  writeFileSync(scriptPath, script);

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, "results");
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  console.log(`Starting endurance test: ${name}`);
  console.log(
    `Monitoring system for the duration of the test (${duration})...`
  );

  // Start monitoring process in the background
  let monitoringInterval: NodeJS.Timeout | null = null;
  const systemMetricsLog: SystemMetrics[] = [];
  const nodeMetricsLog: NodeProcessMetrics[] = [];

  try {
    // Set up monitoring interval
    monitoringInterval = setInterval(async () => {
      try {
        const systemMetrics = await collectSystemMetrics();
        const nodeMetrics = await monitorNodeProcess();

        systemMetricsLog.push(systemMetrics);
        nodeMetricsLog.push(nodeMetrics);

        console.log(
          `[Monitor] CPU: ${systemMetrics.cpuLoad.toFixed(
            2
          )}%, Mem: ${systemMetrics.memoryUsage.usedMemPercentage.toFixed(2)}%`
        );
      } catch (monitorError) {
        console.error("Error collecting metrics:", monitorError);
      }
    }, 5000); // Collect metrics every 5 seconds

    // Execute k6 with the script
    const { stdout, stderr } = await execAsync(
      `k6 run --summary-export=results/${name}_endurance.json ${scriptPath}`
    );

    console.log(`${name} endurance test completed`);

    // Save the metrics logs
    writeFileSync(
      path.join(resultsDir, `${name}_system_metrics.json`),
      JSON.stringify(systemMetricsLog, null, 2)
    );

    writeFileSync(
      path.join(resultsDir, `${name}_node_metrics.json`),
      JSON.stringify(nodeMetricsLog, null, 2)
    );

    if (stderr) {
      console.error(`Errors during test: ${stderr}`);
    }

    return {
      name,
      success: !stderr,
      summary: stdout,
      systemMetrics: {
        samples: systemMetricsLog.length,
        maxCpuLoad: Math.max(...systemMetricsLog.map((m) => m.cpuLoad)),
        avgCpuLoad:
          systemMetricsLog.reduce((sum, m) => sum + m.cpuLoad, 0) /
          systemMetricsLog.length,
        maxMemUsage: Math.max(
          ...systemMetricsLog.map((m) => m.memoryUsage.usedMemPercentage)
        ),
        avgMemUsage:
          systemMetricsLog.reduce(
            (sum, m) => sum + m.memoryUsage.usedMemPercentage,
            0
          ) / systemMetricsLog.length
      }
    };
  } catch (error) {
    console.error(`Test execution failed for ${name}:`, error);
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Clean up monitoring
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }

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
 * Runs all endurance tests
 */
export async function runEnduranceTests(): Promise<EnduranceTestResult[]> {
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
