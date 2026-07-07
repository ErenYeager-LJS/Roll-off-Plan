import { DEFAULT_TARGETS } from "./food-data.js";

const STORAGE_KEY = "nutrition-pwa-state-v1";

export function createInitialState() {
  return {
    days: {},
    customFoods: [],
    targets: structuredClone(DEFAULT_TARGETS),
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    return {
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
      customFoods: Array.isArray(parsed.customFoods) ? parsed.customFoods : [],
      targets: parsed.targets || structuredClone(DEFAULT_TARGETS),
    };
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetToday(state, dateKey) {
  const next = structuredClone(state);
  delete next.days[dateKey];
  saveState(next);
  return next;
}
