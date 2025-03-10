// performance/database-tests.ts
/**
 * Database performance testing
 * Tests critical database operations under various loads
 */

import { Pool } from 'pg';
import { performance } from 'perf_hooks';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

// Database connection pool based on your application settings
const pool = new Pool({
  user: process.env.DB_USER || 'myuser',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'headphoneweb',
  password: process.env.DB_PASSWORD || 'mypassword',
  port: parseInt(process.env.DB_PORT || '5432', 10)
});

/**
 * Test case interface for database operations
 */
interface DBTestCase {
  name: string;
  description: string;
  setUp?: () => Promise<any>;
  execute: (setupData?: any) => Promise<void>;
  tearDown?: (setupData?: any) => Promise<void>;
  iterations: number;
}

/**
 * Generates random test data for orders
 */
function generateOrderTestData(count: number = 1) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      payment_intent_id: `pi_test_${Date.now()}_${i}`,
      email: `perf_test_${Date.now()}@example.com`,
      total_price: 199.99,
      status: 'pending'
    });
  }
];

/**
 * Runs a single database test case
 */
async function runDBTestCase(testCase: DBTestCase): Promise<any> {
  console.log(`Running DB test: ${testCase.name} - ${testCase.description}`);
  
  let setupData;
  const results = {
    name: testCase.name,
    description: testCase.description,
    iterations: testCase.iterations,
    executionTimes: [] as number[],
    success: false,
    error: null as string | null,
    stats: {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      p95: 0,
      p99: 0
    }
  };
  
  try {
    // Run setup if provided
    if (testCase.setUp) {
      setupData = await testCase.setUp();
    }
    
    // Run the test iterations and measure performance
    for (let i = 0; i < testCase.iterations; i++) {
      const startTime = performance.now();
      await testCase.execute(setupData);
      const endTime = performance.now();
      
      const executionTime = endTime - startTime;
      results.executionTimes.push(executionTime);
    }
    
    // Calculate statistics
    if (results.executionTimes.length > 0) {
      const sortedTimes = [...results.executionTimes].sort((a, b) => a - b);
      
      results.stats.min = sortedTimes[0];
      results.stats.max = sortedTimes[sortedTimes.length - 1];
      results.stats.avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
      
      // Calculate median (50th percentile)
      const midIndex = Math.floor(sortedTimes.length / 2);
      results.stats.median = sortedTimes.length % 2 === 0
        ? (sortedTimes[midIndex - 1] + sortedTimes[midIndex]) / 2
        : sortedTimes[midIndex];
      
      // Calculate 95th percentile
      const p95Index = Math.floor(sortedTimes.length * 0.95);
      results.stats.p95 = sortedTimes[p95Index];
      
      // Calculate 99th percentile
      const p99Index = Math.floor(sortedTimes.length * 0.99);
      results.stats.p99 = sortedTimes[p99Index];
    }
    
    results.success = true;
  } catch (error) {
    console.error(`Error running ${testCase.name}:`, error);
    results.error = error.message;
  } finally {
    // Always run teardown if provided
    if (testCase.tearDown) {
      try {
        await testCase.tearDown(setupData);
      } catch (teardownError) {
        console.error(`Error during teardown for ${testCase.name}:`, teardownError);
      }
    }
  }
  
  return results;
}

/**
 * Runs all database performance tests
 */
export async function runDatabaseTests(): Promise<any> {
  console.log('Starting database performance tests...');
  
  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }
  
  const results = [];
  
  try {
    // Run each test case
    for (const testCase of dbTestCases) {
      const result = await runDBTestCase(testCase);
      results.push(result);
      
      // Log results
      if (result.success) {
        console.log(`✅ ${result.name}: Avg: ${result.stats.avg.toFixed(2)}ms, p95: ${result.stats.p95.toFixed(2)}ms`);
      } else {
        console.log(`❌ ${result.name}: Failed - ${result.error}`);
      }
    }
    
    // Save results to file
    const resultsPath = path.join(resultsDir, 'database-performance.json');
    writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    return results;
  } finally {
    // Always close the pool
    await pool.end();
  }
}
  return items;
}

/**
 * Test cases for critical database operations
 */
const dbTestCases: DBTestCase[] = [
  // Test case 1: Cart operations (multiple concurrent inserts)
  {
    name: 'cart_insert_performance',
    description: 'Tests insertion performance for cart operations',
    setUp: async () => {
      // Create test session
      const result = await pool.query(
        'INSERT INTO cart_session(user_identifier) VALUES($1) RETURNING session_id',
        [`perf_test_${Date.now()}`]
      );
      return { sessionId: result.rows[0].session_id };
    },
    execute: async (setupData) => {
      // Insert cart item
      await pool.query(
        'INSERT INTO cart_items(session_id, product_id, quantity) VALUES($1, $2, $3)',
        [setupData.sessionId, 1, 1]
      );
    },
    tearDown: async (setupData) => {
      // Clean up test data
      await pool.query('DELETE FROM cart_items WHERE session_id = $1', [setupData.sessionId]);
      await pool.query('DELETE FROM cart_session WHERE session_id = $1', [setupData.sessionId]);
    },
    iterations: 100 // Run 100 iterations
  },
  
  // Test case 2: Order creation with transaction
  {
    name: 'order_creation_transaction',
    description: 'Tests order creation with transaction performance',
    execute: async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Create order
        const orderData = generateOrderTestData(1)[0];
        const orderResult = await client.query(
          `INSERT INTO "ORDER" (payment_intent_id, email, total_price, status) 
           VALUES ($1, $2, $3, $4) RETURNING order_id`,
          [orderData.payment_intent_id, orderData.email, orderData.total_price, orderData.status]
        );
        
        const orderId = orderResult.rows[0].order_id;
        
        // Create order item
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price_at_time) 
           VALUES ($1, $2, $3, $4)`,
          [orderId, 1, 1, 199.99]
        );
        
        // Create payment record
        await client.query(
          `INSERT INTO payment (order_id, stripe_payment_id, payment_status, amount_received) 
           VALUES ($1, $2, $3, $4)`,
          [orderId, `py_test_${Date.now()}`, 'pending', 199.99]
        );
        
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    },
    iterations: 50 // Run 50 iterations
  },
  
  // Test case 3: Contact message search performance
  {
    name: 'contact_message_search',
    description: 'Tests contact message search performance',
    setUp: async () => {
      // Create batch of test messages
      const messages = [];
      for (let i = 0; i < 100; i++) {
        messages.push({
          name: `Test User ${i}`,
          email: `test${i}_${Date.now()}@example.com`,
          message: `This is test message ${i} for performance testing created at ${new Date().toISOString()}`
        });
      }
      
      // Insert all messages
      for (const msg of messages) {
        await pool.query(
          'INSERT INTO contact_message(name, email, message) VALUES($1, $2, $3)',
          [msg.name, msg.email, msg.message]
        );
      }
      
      return { count: messages.length };
    },
    execute: async () => {
      // Test query patterns based on your application
      await pool.query("SELECT * FROM contact_message WHERE status = 'UNREAD' ORDER BY message_date DESC LIMIT 50");
      await pool.query("SELECT COUNT(*) FROM contact_message GROUP BY status");
      await pool.query("SELECT * FROM contact_message WHERE email LIKE '%example.com' LIMIT 20");
    },
    tearDown: async () => {
      // Clean up test data - delete performance test messages only
      await pool.query("DELETE FROM contact_message WHERE email LIKE '%_" + Date.now() + "@example.com'");
    },
    iterations: 20 // Run 20 iterations - fewer because setup is intensive
  },
  
  // Test case 4: Product inventory update under contention
  {
    name: 'inventory_update_contention',
    description: 'Tests product inventory updates under contention',
    setUp: async () => {
      // Reset stock quantity for test product
      await pool.query('UPDATE headphones SET stock_quantity = 1000 WHERE product_id = 1');
      return { productId: 1 };
    },
    execute: async (setupData) => {
      // Simulate inventory decrement during checkout
      await pool.query(
        'UPDATE headphones SET stock_quantity = stock_quantity - 1 WHERE product_id = $1 AND stock_quantity > 0',
        [setupData.productId]
      );
    },
    tearDown: async (setupData) => {
      // Reset stock quantity after test
      await pool.query('UPDATE headphones SET stock_quantity = 1000 WHERE product_id = $1', [setupData.productId]);
    },
    iterations: 100 // Run 100 iterations - simulating concurrent checkouts
  },
  
  // Test case 5: Complex query joining multiple tables
  {
    name: 'complex_order_query',
    description: 'Tests complex order query performance with multiple joins',
    setUp: async () => {
      // Create 10 test orders with items and payments
      const orderIds = [];
      
      for (let i = 0; i < 10; i++) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          const orderResult = await client.query(
            `INSERT INTO "ORDER" (payment_intent_id, email, total_price, status) 
             VALUES ($1, $2, $3, $4) RETURNING order_id`,
            [`pi_perf_${Date.now()}_${i}`, `perf_complex_${Date.now()}@example.com`, 199.99, 'pending']
          );
          
          const orderId = orderResult.rows[0].order_id;
          orderIds.push(orderId);
          
          await client.query(
            `INSERT INTO order_items (order_id, product_id, quantity, price_at_time) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, 1, 1, 199.99]
          );
          
          await client.query(
            `INSERT INTO payment (order_id, stripe_payment_id, payment_status, amount_received) 
             VALUES ($1, $2, $3, $4)`,
            [orderId, `py_complex_${Date.now()}_${i}`, 'pending', 199.99]
          );
          
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }
      
      return { orderIds };
    },
    execute: async () => {
      // Complex query joining multiple tables
      await pool.query(`
        SELECT o.order_id, o.email, o.total_price, o.status, 
               p.payment_status, p.amount_received,
               oi.product_id, oi.quantity, oi.price_at_time,
               h.name as product_name, h.image_url
        FROM "ORDER" o
        JOIN payment p ON o.order_id = p.order_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN headphones h ON oi.product_id = h.product_id
        WHERE o.email LIKE '%example.com'
        ORDER BY o.created_at DESC
      `);
    },
    tearDown: async (setupData) => {
      // Clean up test data
      if (setupData && setupData.orderIds && setupData.orderIds.length > 0) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          for (const orderId of setupData.orderIds) {
            await client.query('DELETE FROM payment WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
            await client.query('DELETE FROM "ORDER" WHERE order_id = $1', [orderId]);
          }
          
          await client.query('COMMIT');
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }
    },
    iterations: 20 // Run 20 iterations - fewer because setup is intensive
  }