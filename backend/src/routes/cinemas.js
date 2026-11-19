import { Router } from 'express';
import { cheapestBundles } from '../lib/bundles.js';
import { conflict, notFound } from '../lib/errors.js';
import { parseGroupSize, parseId, parseNewCinema } from '../lib/validate.js';

export function cinemasRouter(store) {
  const router = Router();

  router.get('/', (req, res) => res.json(store.listCinemas()));

  router.post('/', (req, res) => {
    const isBatch = Array.isArray(req.body);
    const inputs = (isBatch ? req.body : [req.body]).map(parseNewCinema);

    const ids = store.transaction(() =>
      inputs.map((input) => {
        if (store.nameTakenBy(input.name) !== null) {
          throw conflict('DUPLICATE_NAME', `a cinema called "${input.name}" already exists`);
        }
        return store.insertCinema(input.name, input.bundleSizes);
      }),
    );

    const created = ids.map((id) => store.getCinema(id));
    res.status(201).json(isBatch ? created : created[0]);
  });

  router.get('/:id/booking', (req, res) => {
    const cinema = store.getCinema(parseId(req.params.id));
    if (!cinema) throw notFound('cinema not found');
    const groupSize = parseGroupSize(req.query.groupSize);

    const result = cheapestBundles(cinema.bundleSizes, groupSize);
    res.json({
      cinema: { id: cinema.id, name: cinema.name },
      groupSize,
      possible: result !== null,
      bundleCount: result?.bundleCount ?? null,
      bundles: result?.bundles ?? [],
      message: result ? undefined : `${groupSize} seats cannot be bought exactly with bundles of ${cinema.bundleSizes.join(', ')}`,
    });
  });

  return router;
}
