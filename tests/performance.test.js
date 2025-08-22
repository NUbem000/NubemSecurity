/**
 * Performance tests for NubemSecurity
 */

const autocannon = require('autocannon');

async function runLoadTest() {
  const result = await autocannon({
    url: 'http://localhost:8080',
    connections: 10,
    pipelining: 1,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/'
      },
      {
        method: 'GET',
        path: '/api/tools'
      },
      {
        method: 'POST',
        path: '/api/query',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'test query',
          k: 5
        })
      }
    ]
  });
  
  console.log('Load test results:');
  console.log(`Requests/sec: ${result.requests.average}`);
  console.log(`Latency (ms): ${result.latency.mean}`);
  console.log(`Throughput (MB/s): ${result.throughput.average / 1024 / 1024}`);
  
  // Assert performance thresholds
  if (result.requests.average < 100) {
    console.error('❌ Performance below threshold: < 100 req/sec');
    process.exit(1);
  }
  
  if (result.latency.mean > 500) {
    console.error('❌ Latency too high: > 500ms');
    process.exit(1);
  }
  
  console.log('✅ Performance test passed');
}

if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest };
