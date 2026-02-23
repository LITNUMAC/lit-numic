import { writable, derived } from "svelte/store";
import { translations } from "./translations.js";

// Read saved locale from localStorage (default: 'id')
const savedLocale =
  typeof window !== "undefined"
    ? localStorage.getItem("litnumic_locale") || "id"
    : "id";

export const locale = writable(savedLocale);

// Persist to localStorage whenever locale changes
locale.subscribe((value) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("litnumic_locale", value);
  }
});

// Toggle between 'id' and 'en'
export function toggleLocale() {
  locale.update((l) => (l === "id" ? "en" : "id"));
}

// Derived translator function: t('key') returns the string for the current locale
export const t = derived(locale, ($locale) => {
  return (key) =>
    translations[$locale]?.[key] ?? translations["id"][key] ?? key;
});
