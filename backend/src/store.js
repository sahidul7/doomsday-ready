// Data access layer: all SQL lives here so routes stay readable.

export function createStore(db) {
  const toMovie = (row, prereqIds) => ({
    id: row.id,
    title: row.title,
    releaseYear: row.release_year,
    runtime: row.runtime,
    watched: row.watched === 1,
    prerequisites: prereqIds,
  });

  const q = {
    allMovies: db.prepare('SELECT * FROM movies ORDER BY release_year, id'),
    movieById: db.prepare('SELECT * FROM movies WHERE id = ?'),
    movieByTitle: db.prepare('SELECT id FROM movies WHERE title = ?'),
    allEdges: db.prepare('SELECT movie_id, prerequisite_id FROM movie_prerequisites ORDER BY prerequisite_id'),
    insertMovie: db.prepare('INSERT INTO movies (title, release_year, runtime, watched) VALUES (?, ?, ?, ?)'),
    updateMovie: db.prepare('UPDATE movies SET title = ?, release_year = ?, runtime = ?, watched = ? WHERE id = ?'),
    clearEdges: db.prepare('DELETE FROM movie_prerequisites WHERE movie_id = ?'),
    addEdge: db.prepare('INSERT INTO movie_prerequisites (movie_id, prerequisite_id) VALUES (?, ?)'),

    allCinemas: db.prepare('SELECT * FROM cinemas ORDER BY id'),
    cinemaById: db.prepare('SELECT * FROM cinemas WHERE id = ?'),
    cinemaByName: db.prepare('SELECT id FROM cinemas WHERE name = ?'),
    insertCinema: db.prepare('INSERT INTO cinemas (name) VALUES (?)'),
    insertBundle: db.prepare('INSERT INTO cinema_bundles (cinema_id, size) VALUES (?, ?)'),
    bundlesFor: db.prepare('SELECT size FROM cinema_bundles WHERE cinema_id = ? ORDER BY size'),
    allBundles: db.prepare('SELECT cinema_id, size FROM cinema_bundles ORDER BY size'),
  };

  const prereqMap = () => {
    const map = new Map();
    for (const { movie_id, prerequisite_id } of q.allEdges.all()) {
      if (!map.has(movie_id)) map.set(movie_id, []);
      map.get(movie_id).push(prerequisite_id);
    }
    return map;
  };

  const setPrereqs = (movieId, ids) => {
    q.clearEdges.run(movieId);
    for (const id of ids) q.addEdge.run(movieId, id);
  };

  return {
    transaction: (fn) => db.transaction(fn)(),

    // ---- movies ----
    prereqMap,
    listMovies() {
      const map = prereqMap();
      return q.allMovies.all().map((r) => toMovie(r, map.get(r.id) ?? []));
    },
    getMovie(id) {
      const row = q.movieById.get(id);
      return row ? toMovie(row, prereqMap().get(id) ?? []) : null;
    },
    movieExists: (id) => q.movieById.get(id) !== undefined,
    titleTakenBy: (title) => q.movieByTitle.get(title)?.id ?? null,
    insertMovie({ title, releaseYear, runtime, watched, prerequisites }) {
      const { lastInsertRowid } = q.insertMovie.run(title, releaseYear, runtime, watched ? 1 : 0);
      const id = Number(lastInsertRowid);
      setPrereqs(id, prerequisites);
      return id;
    },
    updateMovie(id, { title, releaseYear, runtime, watched, prerequisites }) {
      q.updateMovie.run(title, releaseYear, runtime, watched ? 1 : 0, id);
      setPrereqs(id, prerequisites);
    },

    // ---- cinemas ----
    nameTakenBy: (name) => q.cinemaByName.get(name)?.id ?? null,
    insertCinema(name, sizes) {
      const id = Number(q.insertCinema.run(name).lastInsertRowid);
      for (const s of sizes) q.insertBundle.run(id, s);
      return id;
    },
    listCinemas() {
      const sizes = new Map();
      for (const { cinema_id, size } of q.allBundles.all()) {
        if (!sizes.has(cinema_id)) sizes.set(cinema_id, []);
        sizes.get(cinema_id).push(size);
      }
      return q.allCinemas.all().map((c) => ({ id: c.id, name: c.name, bundleSizes: sizes.get(c.id) ?? [] }));
    },
    getCinema(id) {
      const c = q.cinemaById.get(id);
      if (!c) return null;
      return { id: c.id, name: c.name, bundleSizes: q.bundlesFor.all(id).map((r) => r.size) };
    },
  };
}
