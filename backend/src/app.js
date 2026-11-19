import cors from 'cors';
import express from 'express';
import { ApiError } from './lib/errors.js';
import { cinemasRouter } from './routes/cinemas.js';
import { moviesRouter } from './routes/movies.js';
import { createStore } from './store.js';

export function createApp(db) {
  const store = createStore(db);
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/movies', moviesRouter(store));
  app.use('/api/cinemas', cinemasRouter(store));

  app.use('/api', (req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'route not found' } });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message } });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'request body is not valid JSON' } });
    }
    console.error(err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'something went wrong' } });
  });

  return app;
}
