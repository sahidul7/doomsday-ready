// Graph helpers for the movie prerequisite graph.
// `prereqs` is a Map<movieId, number[]> (edges point from a movie to what must be watched first).
// Everything is iterative (explicit stacks) so a very long chain cannot overflow the call stack.

/**
 * Would giving `movieId` the prerequisites `newPrereqIds` create a cycle?
 * A cycle appears exactly when `movieId` is already reachable from one of the
 * new prerequisites by following prerequisite edges (or when it lists itself).
 */
export function wouldCreateCycle(prereqs, movieId, newPrereqIds) {
  const seen = new Set();
  const stack = [...newPrereqIds];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === movieId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of prereqs.get(current) ?? []) stack.push(next);
  }
  return false;
}

/**
 * Every movie that must be seen before `targetId`, each once, ordered so that
 * every movie appears after all of its own prerequisites. The target is excluded.
 * This is a depth-first post-order traversal (a topological sort of the sub-graph).
 * Assumes the graph has no cycles, which the validation above guarantees.
 */
export function rewatchOrder(prereqs, targetId) {
  const visited = new Set([targetId]);
  const order = [];
  // Each stack frame remembers which prerequisite it will look at next.
  const stack = [{ id: targetId, deps: prereqs.get(targetId) ?? [], next: 0 }];

  while (stack.length > 0) {
    const frame = stack[stack.length - 1];

    if (frame.next < frame.deps.length) {
      const dep = frame.deps[frame.next++];
      if (!visited.has(dep)) {
        visited.add(dep);
        stack.push({ id: dep, deps: prereqs.get(dep) ?? [], next: 0 });
      }
    } else {
      // All prerequisites of this movie are already in `order`, so it can go in now.
      stack.pop();
      if (frame.id !== targetId) order.push(frame.id);
    }
  }
  return order;
}
