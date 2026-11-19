import { useState } from 'react';
import { api } from '../api.js';

function PrereqChecklist({ movies, selected, onChange, excludeId }) {
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const options = movies.filter((m) => m.id !== excludeId);

  if (options.length === 0) return <p className="muted">No other movies yet.</p>;
  return (
    <div className="checklist">
      {options.map((m) => (
        <label key={m.id}>
          <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
          {m.title}
        </label>
      ))}
    </div>
  );
}

function AddMovieForm({ movies, onAdded }) {
  const [title, setTitle] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [runtime, setRuntime] = useState('');
  const [prerequisites, setPrerequisites] = useState([]);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createMovie({
        title,
        releaseYear: Number(releaseYear),
        runtime: Number(runtime),
        prerequisites,
      });
      setTitle('');
      setReleaseYear('');
      setRuntime('');
      setPrerequisites([]);
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add a movie</h2>
      <div className="row">
        <label className="grow">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label>
          Release year
          <input type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} required />
        </label>
        <label>
          Runtime (min)
          <input type="number" min="1" max="300" value={runtime} onChange={(e) => setRuntime(e.target.value)} required />
        </label>
      </div>
      <fieldset>
        <legend>Watch these first</legend>
        <PrereqChecklist movies={movies} selected={prerequisites} onChange={setPrerequisites} />
      </fieldset>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Add movie</button>
    </form>
  );
}

function MovieRow({ movie, movies, reload }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(movie.prerequisites);
  const [error, setError] = useState('');
  const titleOf = (id) => movies.find((m) => m.id === id)?.title ?? `#${id}`;

  async function toggleWatched() {
    setError('');
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePrereqs() {
    setError('');
    try {
      await api.updateMovie(movie.id, { prerequisites: draft });
      setEditing(false);
      await reload();
    } catch (err) {
      setError(err.message); // e.g. the circular dependency message
    }
  }

  return (
    <li className="movie">
      <label className="watch">
        <input type="checkbox" checked={movie.watched} onChange={toggleWatched} />
        <span className="sr-only">Watched {movie.title}</span>
      </label>
      <div className="grow">
        <strong className={movie.watched ? 'done' : ''}>{movie.title}</strong>
        <span className="muted"> {movie.releaseYear}, {movie.runtime} min</span>
        <div className="muted small">
          {movie.prerequisites.length === 0
            ? 'No prerequisites'
            : `Needs: ${movie.prerequisites.map(titleOf).join(', ')}`}
        </div>
        {editing && (
          <div className="editor">
            <PrereqChecklist movies={movies} selected={draft} onChange={setDraft} excludeId={movie.id} />
            <button className="primary" onClick={savePrereqs}>Save prerequisites</button>{' '}
            <button onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      {!editing && (
        <button onClick={() => { setDraft(movie.prerequisites); setEditing(true); }}>Edit prerequisites</button>
      )}
    </li>
  );
}

export default function MoviesView({ movies, reload }) {
  return (
    <>
      <AddMovieForm movies={movies} onAdded={reload} />
      <section className="panel">
        <h2>All movies</h2>
        {movies.length === 0 ? (
          <p className="muted">Nothing here yet. Add your first movie above.</p>
        ) : (
          <ul className="list">
            {movies.map((m) => (
              <MovieRow key={m.id} movie={m} movies={movies} reload={reload} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
