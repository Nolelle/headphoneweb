
    import http from 'k6/http';
    import { sleep, check } from 'k6';
    
    export const options = {
      scenarios: {
        browsing_flow: {
          executor: 'ramping-vus',
          startVUs: 0,
          stages: [
            { duration: '30s', target: 50 },  // Ramp up to 50 users
            { duration: '1m', target: 100 },  // Ramp up to 100 users
            { duration: '2m', target: 100 },  // Stay at 100 users
            { duration: '30s', target: 0 }    // Ramp down
          ],
          gracefulRampDown: '30s'
        }
      },
      thresholds: {
        'http_req_duration': ['p(95)<500', 'p(99)<1500'],  // 95% of requests must complete within 500ms, 99% within 1.5s
        'http_req_failed': ['rate<0.01']              // Error rate must be less than 1%
      }
    };
    
    export default function() {
      // Simulate home page visit
      let res = http.get('http://localhost:3000/');
      check(res, { 'homepage status is 200': (r) => r.status === 200 });
      sleep(2);
      
      // Simulate scrolling to product section
      res = http.get('http://localhost:3000/#headphone');
      check(res, { 'product section loads': (r) => r.status === 200 });
      sleep(3);
      
      // Simulate viewing product details (in your app this is on the main page)
      sleep(5);
    }
  