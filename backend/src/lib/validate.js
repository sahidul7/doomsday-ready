import { validation } from './errors.js';

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v) => typeof v === 'number' && Number.isInteger(v);

export function parseId(raw) {
  if (!/^\d+$/.test(String(raw))) throw validation('id must be a positive integer');
  return Number(raw);
}

function title(value, field = 'title') {
  if (typeof value !== 'string' || value.trim() === '') throw validation(`${field} is required`);
  if (value.trim().length > 200) throw validation(`${field} must be at most 200 characters`);
  return value.trim();
}

function intInRange(value, field, min, max) {
  if (!isInt(value) || value < min || value > max) {
    throw validation(`${field} must be a whole number between ${min} and ${max}`);
  }
  return value;
}

function idList(value) {
  if (!Array.isArray(value) || !value.every((v) => isInt(v) && v > 0)) {
    throw validation('prerequisites must be an array of movie ids');
  }
  return [...new Set(value)]; // duplicates are harmless, drop them
}

/** Body for POST /movies. */
export function parseNewMovie(body) {
  if (!isPlainObject(body)) throw validation('movie must be a JSON object');
  return {
    title: title(body.title),
    releaseYear: intInRange(body.releaseYear, 'releaseYear', 1888, 2100),
    runtime: intInRange(body.runtime, 'runtime', 1, 300),
    watched: body.watched === undefined ? false : parseBool(body.watched),
    prerequisites: body.prerequisites === undefined ? [] : idList(body.prerequisites),
  };
}

/** Body for PATCH /movies/:id. Only the fields that are present are changed. */
export function parseMoviePatch(body, existing) {
  if (!isPlainObject(body)) throw validation('body must be a JSON object');
  return {
    title: body.title === undefined ? existing.title : title(body.title),
    releaseYear: body.releaseYear === undefined ? existing.releaseYear : intInRange(body.releaseYear, 'releaseYear', 1888, 2100),
    runtime: body.runtime === undefined ? existing.runtime : intInRange(body.runtime, 'runtime', 1, 300),
    watched: body.watched === undefined ? existing.watched : parseBool(body.watched),
    prerequisites: body.prerequisites === undefined ? existing.prerequisites : idList(body.prerequisites),
  };
}

function parseBool(v) {
  if (typeof v !== 'boolean') throw validation('watched must be true or false');
  return v;
}

/** Body for POST /cinemas. */
export function parseNewCinema(body) {
  if (!isPlainObject(body)) throw validation('cinema must be a JSON object');
  const name = title(body.name, 'name');
  const sizes = body.bundleSizes;
  if (!Array.isArray(sizes) || sizes.length < 1 || sizes.length > 10) {
    throw validation('bundleSizes must be an array of 1 to 10 sizes');
  }
  sizes.forEach((s) => intInRange(s, 'each bundle size', 1, 500));
  if (new Set(sizes).size !== sizes.length) throw validation('bundleSizes must all be different');
  return { name, bundleSizes: [...sizes].sort((a, b) => a - b) };
}

export function parseGroupSize(raw) {
  if (!/^\d+$/.test(String(raw ?? ''))) throw validation('groupSize must be a whole number between 1 and 10000');
  return intInRange(Number(raw), 'groupSize', 1, 10000);
}
