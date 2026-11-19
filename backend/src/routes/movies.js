import { Router } from 'express';
import { conflict, notFound, validation } from '../lib/errors.js';
import { rewatchOrder, wouldCreateCycle } from '../lib/graph.js';
import { parseId, parseMoviePatch, parseNewMovie } from '../lib/validate.js';

export function moviesRouter(store) {
  const router = Router();

  function assertPrereqsExist(ids) {
    for (const id of ids) {
      if (!store.movieExists(id)) throw validation(`prerequisite movie ${id} does not exist`);
    }
  }

  function assertTitleFree(title, ownId = null) {
    const owner = store.titleTakenBy(title);
    if (owner !== null && owner !== ownId) throw conflict('DUPLICATE_TITLE', `a movie called "${title}" already exists`);
  }

  router.get('/', (req, res) => res.json(store.listMovies()));

  // Accepts one movie or an array of movies. An array is all-or-nothing.
  router.post('/', (req, res) => {
    const isBatch = Array.isArray(req.body);
    const inputs = (isBatch ? req.body : [req.body]).map(parseNewMovie);
    if (isBatch && inputs.length === 0) throw validation('send at least one movie');

    const ids = store.transaction(() => {
      return inputs.map((input) => {
        assertTitleFree(input.title);
        assertPrereqsExist(input.prerequisites);
        // A brand new movie has nobody depending on it yet, so it cannot close a loop.
        return store.insertMovie(input);
      });
    });

    const created = ids.map((id) => store.getMovie(id));
    res.status(201).json(isBatch ? created : created[0]);
  });

  router.get('/:id', (req, res) => {
    const movie = store.getMovie(parseId(req.params.id));
    if (!movie) throw notFound('movie not found');
    res.json(movie);
  });

  router.patch('/:id', (req, res) => {
    const id = parseId(req.params.id);
    const existing = store.getMovie(id);
    if (!existing) throw notFound('movie not found');

    const next = parseMoviePatch(req.body, existing);
    assertPrereqsExist(next.prerequisites);
    if (wouldCreateCycle(store.prereqMap(), id, next.prerequisites)) {
      throw conflict('CIRCULAR_DEPENDENCY', 'these prerequisites would make the movie depend on itself');
    }
    assertTitleFree(next.title, id);

    store.transaction(() => store.updateMovie(id, next));
    res.json(store.getMovie(id));
  });

  router.get('/:id/rewatch-order', (req, res) => {
    const id = parseId(req.params.id);
    const target = store.getMovie(id);
    if (!target) throw notFound('movie not found');

    const all = new Map(store.listMovies().map((m) => [m.id, m]));
    const order = rewatchOrder(store.prereqMap(), id).map((mid) => all.get(mid));

    const unwatched = order.filter((m) => !m.watched);
    res.json({
      target: { id: target.id, title: target.title },
      order,
      totalCount: order.length,
      watchedCount: order.length - unwatched.length,
      remainingMinutes: unwatched.reduce((sum, m) => sum + m.runtime, 0),
    });
  });

  return router;
}
