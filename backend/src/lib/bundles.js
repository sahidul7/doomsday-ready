/**
 * Fewest bundles that add up to exactly `groupSize` (unbounded coin-change DP).
 * best[n]   = fewest bundles needed to seat exactly n people (Infinity if impossible)
 * choice[n] = the last bundle size used in that best solution, so we can rebuild it.
 * Sizes are tried largest first and only a strictly better count replaces the
 * current one, so ties are resolved in favour of bigger bundles (deterministic).
 * Time O(groupSize * sizes), memory O(groupSize).
 */
export function cheapestBundles(sizes, groupSize) {
  const sorted = [...sizes].sort((a, b) => b - a);
  const best = new Array(groupSize + 1).fill(Infinity);
  const choice = new Array(groupSize + 1).fill(0);
  best[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of sorted) {
      if (size > seats) continue;
      const candidate = best[seats - size] + 1;
      if (candidate < best[seats]) {
        best[seats] = candidate;
        choice[seats] = size;
      }
    }
  }

  if (best[groupSize] === Infinity) return null;

  const counts = new Map();
  for (let left = groupSize; left > 0; left -= choice[left]) {
    counts.set(choice[left], (counts.get(choice[left]) ?? 0) + 1);
  }
  const bundles = [...counts.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return { bundleCount: best[groupSize], bundles };
}
