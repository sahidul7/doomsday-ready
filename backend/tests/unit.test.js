import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cheapestBundles } from '../src/lib/bundles.js';
import { rewatchOrder, wouldCreateCycle } from '../src/lib/graph.js';

test('bundles: examples from the brief', () => {
  assert.deepEqual(cheapestBundles([1, 3, 4], 6), { bundleCount: 2, bundles: [{ size: 3, count: 2 }] });
  assert.deepEqual(cheapestBundles([2, 5], 11), { bundleCount: 4, bundles: [{ size: 5, count: 1 }, { size: 2, count: 3 }] });
  assert.deepEqual(cheapestBundles([6, 9, 20], 44), {
    bundleCount: 4,
    bundles: [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }],
  });
  assert.equal(cheapestBundles([4, 6], 7), null);
});

test('bundles: greedy would fail here, DP must not', () => {
  // greedy picks 4+1+1 (3 bundles); the best is 3+3 (2 bundles)
  assert.equal(cheapestBundles([1, 3, 4], 6).bundleCount, 2);
});

test('bundles: large group stays fast and exact', () => {
  const r = cheapestBundles([1, 500], 10000);
  assert.deepEqual(r, { bundleCount: 20, bundles: [{ size: 500, count: 20 }] });
});

const graph = (obj) => new Map(Object.entries(obj).map(([k, v]) => [Number(k), v]));

test('rewatchOrder: each movie once, after its prerequisites', () => {
  // diamond: 4 <- 2,3 ; 2 <- 1 ; 3 <- 1
  const g = graph({ 4: [2, 3], 2: [1], 3: [1] });
  const order = rewatchOrder(g, 4);
  assert.equal(order.length, 3);
  assert.ok(!order.includes(4));
  assert.ok(order.indexOf(1) < order.indexOf(2));
  assert.ok(order.indexOf(1) < order.indexOf(3));
});

test('rewatchOrder: no prerequisites gives an empty list', () => {
  assert.deepEqual(rewatchOrder(graph({}), 1), []);
});

test('cycle detection', () => {
  const g = graph({ 2: [1], 3: [2] }); // 3 needs 2 needs 1
  assert.equal(wouldCreateCycle(g, 1, [3]), true); // 1 needing 3 closes the loop
  assert.equal(wouldCreateCycle(g, 1, [1]), true); // self reference
  assert.equal(wouldCreateCycle(g, 3, [1]), false); // harmless shortcut
});

test('very long chain does not overflow the stack', () => {
  const g = new Map();
  for (let i = 2; i <= 50000; i++) g.set(i, [i - 1]);
  assert.equal(rewatchOrder(g, 50000).length, 49999);
});
