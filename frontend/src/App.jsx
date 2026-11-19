import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import BookingView from './views/BookingView.jsx';
import MoviesView from './views/MoviesView.jsx';
import RewatchView from './views/RewatchView.jsx';

const TABS = [
  { id: 'movies', label: 'Movies' },
  { id: 'rewatch', label: 'Rewatch plan' },
  { id: 'booking', label: 'Booking' },
];

export default function App() {
  const [tab, setTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [loadError, setLoadError] = useState('');

  const reloadMovies = useCallback(() => api.listMovies().then(setMovies), []);
  const reloadCinemas = useCallback(() => api.listCinemas().then(setCinemas), []);

  useEffect(() => {
    Promise.all([reloadMovies(), reloadCinemas()]).catch((e) => setLoadError(e.message));
  }, [reloadMovies, reloadCinemas]);

  return (
    <div className="shell">
      <header className="top">
        <h1>Doomsday Ready</h1>
        <p>Catch up on the films you need, then book opening night.</p>
        <nav aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} className={t.id === tab ? 'tab active' : 'tab'} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {loadError && <p className="error" role="alert">Could not reach the API: {loadError}</p>}
        {tab === 'movies' && <MoviesView movies={movies} reload={reloadMovies} />}
        {tab === 'rewatch' && <RewatchView movies={movies} reload={reloadMovies} />}
        {tab === 'booking' && <BookingView cinemas={cinemas} reload={reloadCinemas} />}
      </main>
    </div>
  );
}
