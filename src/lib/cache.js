import { writable, get } from "svelte/store";

export const dataCache = writable({
  dashboard: null,
  adminStats: null,
  comics: null,
  users: null,
  leaderboard: null,
  questions: {},
});

export function getCached(key, subKey = null) {
  const cache = get(dataCache); // Mengambil nilai store secara instan tanpa subscribe
  if (subKey) {
    return cache[key] ? cache[key][subKey] : null;
  }
  return cache[key];
}

export function setCached(key, data, subKey = null) {
  dataCache.update((cache) => {
    if (subKey) {
      if (!cache[key]) cache[key] = {};
      cache[key][subKey] = data;
    } else {
      cache[key] = data;
    }
    return cache;
  });
}
