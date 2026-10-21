/**
 * Benchmark runner for Stage 5 and Stage 6 engineering modules
 */
import { runStage5BenchmarkSuite } from '../src/engineering/stage5Benchmark.ts';
import { runStage6BenchmarkSuite } from '../src/engineering/stage6Benchmark.ts';

console.log('Running Stage 5 Benchmarks...');
const s5Tests = runStage5BenchmarkSuite();
const s5Passed = s5Tests.filter(t => t.passed).length;
console.log(`Stage 5 Results: ${s5Passed} / ${s5Tests.length} passed (${s5Passed === s5Tests.length ? 'ALL PASS' : 'SOME FAILED'})`);

console.log('\nRunning Stage 6 Benchmarks...');
const s6Tests = runStage6BenchmarkSuite();
const s6Passed = s6Tests.filter(t => t.passed).length;
console.log(`Stage 6 Results: ${s6Passed} / ${s6Tests.length} passed (${s6Passed === s6Tests.length ? 'ALL PASS' : 'SOME FAILED'})`);

if (s5Passed !== s5Tests.length || s6Passed !== s6Tests.length) {
  process.exit(1);
} else {
  console.log('\n>>> ALL BENCHMARK SUITES: [PASS] <<<');
}
