import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';

const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : `${h} h ${m} min`;
};

export default function RewatchView({ movies, reload }) {
  const [targetId, setTargetId] = useState('');
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (id) => {
    if (!id) return setPlan(null);
    try {
      setError('');
      setPlan(await api.rewatchOrder(id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load(targetId);
  }, [targetId, load]);

  async function toggle(movie) {
    try {
      await api.updateMovie(movie.id, { watched: !movie.watched });
      await Promise.all([load(targetId), reload()]);
    } catch (err) {
      setError(err.message);
    }
  }

  const percent = plan && plan.totalCount > 0 ? Math.round((plan.watchedCount / plan.totalCount) * 100) : 100;

  return (
    <section className="panel">
      <h2>Rewatch plan</h2>
      <label>
        Movie you want to be ready for
        <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">Choose a movie</option>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </label>

      {error && <p className="error" role="alert">{error}</p>}

      {plan && (
        <>
          {plan.totalCount === 0 ? (
            <p className="muted">{plan.target.title} has no prerequisites. You can watch it right away.</p>
          ) : (
            <>
              <div className="progress-label">
                <strong>{plan.watchedCount} of {plan.totalCount} watched</strong>
                <span className="muted">{formatTime(plan.remainingMinutes)} left to watch</span>
              </div>
              <div className="bar" role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100">
                <div className="fill" style={{ width: `${percent}%` }} />
              </div>
              <ol className="list order">
                {plan.order.map((m) => (
                  <li key={m.id} className="movie">
                    <label className="watch">
                      <input type="checkbox" checked={m.watched} onChange={() => toggle(m)} />
                      <span className="sr-only">Watched {m.title}</span>
                    </label>
                    <div className="grow">
                      <strong className={m.watched ? 'done' : ''}>{m.title}</strong>
                      <span className="muted"> {m.releaseYear}, {m.runtime} min</span>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
    </section>
  );
}
