
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        recovery_benchmark: {
          executor: 'constant-arrival-rate',
          rate: 1,
          timeUnit: '1s',
          duration: '30s',
          preAllocatedVUs: 5,
          maxVUs: 10
        }
      }
    };
    
    export default function() {
      const start = new Date();
      
      // Make request to the main API endpoint that was spiked
      let endpoint = 'http://localhost:3000/';
      if ('homePageSpike' === 'cartApiSpike') {
        endpoint = `http://localhost:3000/api/cart?sessionId=recovery-${__VU}-${__ITER}`;
      } else if ('homePageSpike' === 'checkoutSpike') {
        endpoint = 'http://localhost:3000/api/stripe/payment-intent';
      } else if ('homePageSpike' === 'contactFormSpike') {
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
            email: `recovery_${Date.now()}_${__VU}@test.com`, 
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
      
      console.log(`${elapsed},${duration}`);
      
      sleep(1);
    }
  