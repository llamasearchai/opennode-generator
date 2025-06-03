const { performance } = require('perf_hooks');

function benchmark() {
  const start = performance.now();
  
  // Add your benchmark code here
  
  const end = performance.now();
  console.log(`Execution time: ${end - start} milliseconds`);
}

if (require.main === module) {
  benchmark();
}

module.exports = { benchmark };
