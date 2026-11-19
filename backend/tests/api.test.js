import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';
import { seedIfEmpty } from '../src/seed.js';

let server;
let base;

before(async () => {
  const db = openDb(':memory:');
  seedIfEmpty(db);
  server = createApp(db).listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(() => server.close());

const call = async (method, path, body) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};
const idOf = async (title) => (await call('GET', '/movies')).body.find((m) => m.title === title).id;

test('rewatch order for Doomsday has the 7 other movies in a valid order', async () => {
  const id = await idOf('Avengers: Doomsday');
  const { body } = await call('GET', `/movies/${id}/rewatch-order`);
  assert.equal(body.totalCount, 7);
  const titles = body.order.map((m) => m.title);
  assert.ok(!titles.includes('Avengers: Doomsday'));
  assert.ok(titles.indexOf('Iron Man') < titles.indexOf('The Avengers'));
  assert.ok(titles.indexOf('Thor: Ragnarok') < titles.indexOf('Avengers: Infinity War'));
  assert.equal(titles.at(-1), 'Avengers: Endgame');
  assert.equal(body.remainingMinutes, 126 + 124 + 143 + 147 + 130 + 149 + 181);
});

test('rewatch order for Thor is empty, Civil War has 3', async () => {
  const thor = await call('GET', `/movies/${await idOf('Thor: Ragnarok')}/rewatch-order`);
  assert.deepEqual(thor.body.order, []);
  const cw = await call('GET', `/movies/${await idOf('Captain America: Civil War')}/rewatch-order`);
  assert.deepEqual(cw.body.order.map((m) => m.title).at(-1), 'The Avengers');
  assert.equal(cw.body.totalCount, 3);
});

test('watched movies are counted and leave the remaining time', async () => {
  const ironMan = await idOf('Iron Man');
  await call('PATCH', `/movies/${ironMan}`, { watched: true });
  const { body } = await call('GET', `/movies/${await idOf('Captain America: Civil War')}/rewatch-order`);
  assert.equal(body.watchedCount, 1);
  assert.equal(body.remainingMinutes, 124 + 143);
});

test('Endgame as prerequisite of Iron Man is rejected with 409', async () => {
  const { status, body } = await call('PATCH', `/movies/${await idOf('Iron Man')}`, {
    prerequisites: [await idOf('Avengers: Endgame')],
  });
  assert.equal(status, 409);
  assert.equal(body.error.code, 'CIRCULAR_DEPENDENCY');
});

test('self dependency is rejected', async () => {
  const id = await idOf('Thor: Ragnarok');
  const { status, body } = await call('PATCH', `/movies/${id}`, { prerequisites: [id] });
  assert.equal(status, 409);
  assert.equal(body.error.code, 'CIRCULAR_DEPENDENCY');
});

test('create validation and unique title', async () => {
  assert.equal((await call('POST', '/movies', { title: 'X', releaseYear: 2020, runtime: 301 })).status, 400);
  assert.equal((await call('POST', '/movies', { title: ' iron man ', releaseYear: 2008, runtime: 100 })).status, 409);
  const ok = await call('POST', '/movies', { title: 'Thor', releaseYear: 2011, runtime: 115 });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.watched, false);
});

test('unknown prerequisite is a 400, unknown movie a 404', async () => {
  assert.equal((await call('POST', '/movies', { title: 'Y', releaseYear: 2020, runtime: 90, prerequisites: [9999] })).status, 400);
  assert.equal((await call('GET', '/movies/9999/rewatch-order')).status, 404);
});

test('cinema create and booking quotes', async () => {
  const made = await call('POST', '/cinemas', { name: 'Test Hall', bundleSizes: [4, 6] });
  assert.equal(made.status, 201);
  const no = await call('GET', `/cinemas/${made.body.id}/booking?groupSize=7`);
  assert.equal(no.body.possible, false);
  const yes = await call('GET', `/cinemas/${made.body.id}/booking?groupSize=10`);
  assert.deepEqual(yes.body.bundles, [{ size: 6, count: 1 }, { size: 4, count: 1 }]);
  assert.equal((await call('GET', `/cinemas/${made.body.id}/booking?groupSize=0`)).status, 400);
  assert.equal((await call('POST', '/cinemas', { name: 'x', bundleSizes: [2, 2] })).status, 400);
  assert.equal((await call('POST', '/cinemas', { name: 'test hall', bundleSizes: [3] })).status, 409);
});
