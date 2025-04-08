
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
  