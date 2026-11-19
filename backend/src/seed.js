import { fileURLToPath } from 'node:url';
import { openDb } from './db.js';
import { createStore } from './store.js';

// Sample data from the assessment brief, plus two cinemas.
const MOVIES = [
  { title: 'Iron Man', releaseYear: 2008, runtime: 126, needs: [] },
  { title: 'Captain America: The First Avenger', releaseYear: 2011, runtime: 124, needs: [] },
  { title: 'The Avengers', releaseYear: 2012, runtime: 143, needs: ['Iron Man', 'Captain America: The First Avenger'] },
  { title: 'Captain America: Civil War', releaseYear: 2016, runtime: 147, needs: ['The Avengers'] },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtime: 130, needs: [] },
  { title: 'Avengers: Infinity War', releaseYear: 2018, runtime: 149, needs: ['Captain America: Civil War', 'Thor: Ragnarok'] },
  { title: 'Avengers: Endgame', releaseYear: 2019, runtime: 181, needs: ['Avengers: Infinity War'] },
  { title: 'Avengers: Doomsday', releaseYear: 2026, runtime: 150, needs: ['Avengers: Endgame'] },
];
const CINEMAS = [
  { name: 'Star Cineplex Dhaka', sizes: [2, 5] },
  { name: 'Bashundhara Premiere', sizes: [6, 9, 20] },
];

export function seedIfEmpty(db) {
  const store = createStore(db);
  if (store.listMovies().length > 0 || store.listCinemas().length > 0) return false;

  store.transaction(() => {
    const idByTitle = new Map();
    for (const m of MOVIES) {
      const id = store.insertMovie({
        title: m.title,
        releaseYear: m.releaseYear,
        runtime: m.runtime,
        watched: false,
        prerequisites: m.needs.map((t) => idByTitle.get(t)),
      });
      idByTitle.set(m.title, id);
    }
    for (const c of CINEMAS) store.insertCinema(c.name, c.sizes);
  });
  return true;
}

// `npm run seed` runs this file directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(seedIfEmpty(openDb()) ? 'Seeded sample data' : 'Database already has data, nothing to do');
}
