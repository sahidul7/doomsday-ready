// Thin wrapper around fetch. Failed calls throw an Error carrying the API's message and code.
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error?.message ?? 'Request failed');
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

export const api = {
  listMovies: () => request('/movies'),
  createMovie: (movie) => request('/movies', { method: 'POST', body: movie }),
  updateMovie: (id, changes) => request(`/movies/${id}`, { method: 'PATCH', body: changes }),
  rewatchOrder: (id) => request(`/movies/${id}/rewatch-order`),
  listCinemas: () => request('/cinemas'),
  createCinema: (cinema) => request('/cinemas', { method: 'POST', body: cinema }),
  booking: (id, groupSize) => request(`/cinemas/${id}/booking?groupSize=${encodeURIComponent(groupSize)}`),
};
