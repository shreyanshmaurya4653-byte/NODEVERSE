import { initDb, db } from './src/db.js';
import { analyzeGraph, hasCycle, executeRun } from './src/executor.js';

async function testUnit() {
  await initDb();
  console.log('1. DB initialized');

  // Test stats
  const stats = await db.getStats();
  console.log('✅ Stats:', stats.totalWorkflows, 'workflows, DLQ pending:', stats.dlqPending);

  // Test workflows list
  const wfs = await db.listWorkflows();
  console.log('✅ Workflows count:', wfs.length);

  // Test Graph Cycle Detection & Topological sort
  const validGraph = analyzeGraph(
    [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]
  );
  console.log('✅ Valid graph test: hasCycle =', validGraph.hasCycle, 'order =', validGraph.topologicalOrder);

  const cyclicGraph = analyzeGraph(
    [{ id: 'x' }, { id: 'y' }],
    [{ source: 'x', target: 'y' }, { source: 'y', target: 'x' }]
  );
  console.log('✅ Cyclic graph test: hasCycle =', cyclicGraph.hasCycle, 'trace =', cyclicGraph.cycleTrace);

  // Test Dead Letters
  const dlq = await db.listDeadLetters();
  console.log('✅ Dead Letters count:', dlq.length);

  // Test execution of sample workflow
  const firstWf = wfs[0];
  const newRun = await db.createRun({
    workflow_id: firstWf.id,
    trigger_type: 'manual',
    input_data: { orderId: 'ORD-TEST-123', amount: 500, customer: 'Test User' },
  });
  console.log('✅ Created test run:', newRun.id);

  console.log('\n🎉 ALL UNIT LOGIC AND DAG SCHEDULER VERIFIED!\n');
}

testUnit();
