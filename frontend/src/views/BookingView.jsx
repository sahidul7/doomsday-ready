import { useState } from 'react';
import { api } from '../api.js';

function AddCinemaForm({ onAdded }) {
  const [name, setName] = useState('');
  const [sizes, setSizes] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const bundleSizes = sizes.split(',').map((s) => s.trim()).filter(Boolean).map(Number);
      await api.createCinema({ name, bundleSizes });
      setName('');
      setSizes('');
      onAdded();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Add a cinema</h2>
      <div className="row">
        <label className="grow">
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="grow">
          Bundle sizes, separated by commas
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="2, 5" required />
        </label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" type="submit">Add cinema</button>
    </form>
  );
}

export default function BookingView({ cinemas, reload }) {
  const [cinemaId, setCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState('');
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const selected = cinemas.find((c) => String(c.id) === cinemaId);

  async function getQuote(e) {
    e.preventDefault();
    setError('');
    setQuote(null);
    try {
      setQuote(await api.booking(cinemaId, groupSize));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <form className="panel" onSubmit={getQuote}>
        <h2>Book opening night</h2>
        <div className="row">
          <label className="grow">
            Cinema
            <select value={cinemaId} onChange={(e) => { setCinemaId(e.target.value); setQuote(null); }} required>
              <option value="">Choose a cinema</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Group size
            <input type="number" min="1" max="10000" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} required />
          </label>
        </div>
        {selected && <p className="muted small">Sells bundles of {selected.bundleSizes.join(', ')} seats.</p>}
        <button className="primary" type="submit">Get quote</button>

        {error && <p className="error" role="alert">{error}</p>}

        {quote && quote.possible && (
          <div className="result" aria-live="polite">
            <strong>{quote.bundleCount} {quote.bundleCount === 1 ? 'bundle' : 'bundles'} for {quote.groupSize} seats</strong>
            <ul>
              {quote.bundles.map((b) => (
                <li key={b.size}>{b.count} × bundle of {b.size}</li>
              ))}
            </ul>
          </div>
        )}
        {quote && !quote.possible && (
          <p className="result bad" aria-live="polite">Not possible. {quote.message}.</p>
        )}
      </form>

      <AddCinemaForm onAdded={reload} />
    </>
  );
}
