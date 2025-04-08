
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
            { duration: '5s', target: 5 },   // Baseline of 5 RPS
            { duration: '5s', target: 200 }, // Sudden spike to 200 RPS
            { duration: '10s', target: 200 }, // Maintain spike
            { duration: '5s', target: 5 },   // Return to baseline
            { duration: '5s', target: 5 }    // Continue at baseline
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
      const res = http.get(`http://localhost:3000/api/cart?sessionId=${sessionId}`);
      
      check(res, {
        'cart API responded': (r) => r.status === 200,
        'cart API responded in time': (r) => r.timings.duration < 5000
      });
      
      // Add a shorter sleep in quick mode
      sleep(0.5);
    }
  