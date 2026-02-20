import { writable } from "svelte/store";

// Centralized cache for application data
export const dataCache = writable({
  dashboard: null,
  adminStats: null,
  comics: null,
  users: null,
  leaderboard: null,
  questions: {}, // Keyed by comicId
});

/**
 * Utility to get cached data or null
 */
export function getCached(key, subKey = null) {
  let value = null;
  dataCache.subscribe((cache) => {
    if (subKey) {
      value = cache[key] ? cache[key][subKey] : null;
    } else {
      value = cache[key];
    }
  })();
  return value;
}

/**
 * Utility to set cached data
 */
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
