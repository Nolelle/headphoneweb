# HeadphoneWeb Performance Testing Guide

This guide explains how to use the performance testing tools for the HeadphoneWeb application. The testing framework is designed to evaluate the application's performance under various conditions and provide insights into potential optimization areas.

## Overview

The performance testing framework includes the following types of tests:

1. **Load Testing**: Evaluates how the application performs under expected normal and peak loads
2. **Frontend Performance**: Measures Core Web Vitals and other key metrics across different pages
3. **Database Performance**: Tests critical database operations under various loads
4. **Endurance Testing**: Tests system behavior under sustained load over extended periods
5. **Spike Testing**: Evaluates how the application handles sudden increases in load

## Prerequisites

Before running the performance tests, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (with the application database set up)
- k6 (for load, endurance, and spike testing) - [Installation Guide](https://k6.io/docs/getting-started/installation/)
- Puppeteer dependencies (for frontend testing)
- wkhtmltopdf (optional, for PDF report generation)

## Installation

1. Install the required Node.js dependencies:

```bash
npm install puppeteer lighthouse chart.js
```

2. Install k6 for load testing:

```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
winget install k6
```

3. Create the performance test directory:

```bash
mkdir -p performance/results
```

## Running Tests

The performance testing framework offers several npm scripts to run different types of tests:

### Running All Tests

To run all performance tests:

```bash
npm run perf
```

### Running Specific Test Types

Run only load tests:

```bash
npm run perf:load
```

Run only frontend performance tests:

```bash
npm run perf:frontend
```

Run only database performance tests:

```bash
npm run perf:database
```

Run only endurance tests:

```bash
npm run perf:endurance
```

Run only spike tests:

```bash
npm run perf:spike
```

### Development vs. Production Mode

For testing with shorter durations (useful during development):

```bash
npm run perf:dev
```

For full-duration tests (suitable for production performance evaluation):

```bash
npm run perf:prod
```

## Test Configuration

### Load Testing

Load tests are defined in `performance/load-tests.ts`. Each test scenario simulates a specific user journey:

- **browsing**: Tests the product browsing experience
- **cartOperations**: Tests adding, updating, and removing items from the cart
- **checkoutProcess**: Tests the checkout flow including payment intent creation
- **contactForm**: Tests the contact form submission process
- **adminDashboard**: Tests admin panel functionality

You can customize the load patterns by modifying the options in each test scenario.

### Frontend Performance

Frontend tests are defined in `performance/frontend-tests.ts`. The tests use Lighthouse to measure Core Web Vitals and other performance metrics for key pages:

- Homepage
- Cart page
- Checkout page

You can adjust performance thresholds in the `thresholds` object.

### Database Performance

Database tests are defined in `performance/database-tests.ts`. Each test evaluates a specific database operation:

- **cart_insert_performance**: Tests insertion performance for cart operations
- **order_creation_transaction**: Tests order creation with transaction performance
- **contact_message_search**: Tests contact message search performance
- **inventory_update_contention**: Tests product inventory updates under contention
- **complex_order_query**: Tests complex query performance with multiple joins

You can modify the number of iterations for each test to adjust the load.

### Endurance Testing

Endurance tests are defined in `performance/endurance-tests.ts`. The tests evaluate system behavior under sustained load:

- **sustainedBrowsing**: Tests sustained browsing activity
- **cartSessionPersistence**: Tests cart session persistence over time
- **databaseConnectionPoolStability**: Tests database connection pool stability

Test duration can be configured by modifying the `testDuration` variable.

### Spike Testing

Spike tests are defined in `performance/spike-tests.ts`. The tests evaluate how the system handles sudden increases in load:

- **homePageSpike**: Tests homepage response to traffic spikes
- **cartApiSpike**: Tests cart API response to traffic spikes
- **checkoutSpike**: Tests checkout process response to traffic spikes
- **contactFormSpike**: Tests contact form response to traffic spikes

You can adjust spike intensity by modifying the target values in each test's stages.

## Test Reports

After running tests, a comprehensive report is generated in the `performance/results` directory with the following outputs:

1. JSON data for each test
2. An HTML report with visualizations
3. A PDF report (if wkhtmltopdf is installed)

The report includes:

- Overall test summary
- Pass/fail status for each test type
- Detailed metrics for each test
- Visualizations of key performance indicators
- Recommendations for potential optimizations

## Interpreting Results

### Load Test Results

- **Request Rate**: The number of requests per second the system can handle
- **Response Time**: The time taken to process requests (p95, p99, average)
- **Error Rate**: The percentage of requests that failed

### Frontend Performance Results

- **First Contentful Paint (FCP)**: Time to first content display
- **Largest Contentful Paint (LCP)**: Time to main content display
- **Cumulative Layout Shift (CLS)**: Visual stability measure
- **Time to Interactive (TTI)**: Time until the page is fully interactive

### Database Performance Results

- **Execution Time**: The time taken for database operations (average, p95, p99)
- **Throughput**: The number of operations per second

### Endurance Test Results

- **Stability**: Whether the system maintains performance over time
- **Resource Usage**: CPU, memory, and other resource utilization trends

### Spike Test Results

- **Recovery Time**: How quickly the system recovers after a spike
- **Error Rate During Spike**: The percentage of requests that failed during the spike
- **Maximum Handled Load**: The maximum load the system could handle during the spike

## Troubleshooting

### Common Issues

1. **k6 Connection Refused**: Ensure the application is running and accessible at <http://localhost:3000>
2. **Database Connection Errors**: Verify database credentials in the .env file
3. **Out of Memory Errors**: Reduce the number of virtual users or adjust the test duration
4. **Puppeteer/Lighthouse Failures**: Ensure all browser dependencies are installed

### Logs

Check the following logs for detailed error information:

- k6 output in the terminal
- Application logs
- Database logs

## Best Practices

1. **Regular Testing**: Run performance tests regularly (e.g., after significant changes)
2. **Baseline Comparison**: Compare results against a baseline to identify regressions
3. **Realistic Scenarios**: Use realistic data and user scenarios
4. **Isolated Environment**: Run tests in an isolated environment to avoid interference
5. **Gradual Load Increase**: Start with low loads and gradually increase to identify breaking points

## Contributing

To add new test scenarios or modify existing ones:

1. Add new test logic to the appropriate test file
2. Update the reporting module if necessary
3. Document the new test in this README

## License

This performance testing framework is part of the HeadphoneWeb project and is subject to the same license.
