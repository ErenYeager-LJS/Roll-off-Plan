async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export function fetchState(date) {
  return request(`/api/state?date=${encodeURIComponent(date)}`);
}

export function fetchHistory(days) {
  return request(`/api/history?days=${encodeURIComponent(days)}`);
}

export function createEntry(entry) {
  return request("/api/entries", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export function removeEntry(id) {
  return request(`/api/entries/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function createCustomFood(food) {
  return request("/api/custom-foods", {
    method: "POST",
    body: JSON.stringify(food),
  });
}

export function saveWeight(date, weight) {
  return request("/api/weights", {
    method: "POST",
    body: JSON.stringify({ date, weight }),
  });
}

export function clearDay(date) {
  return request(`/api/day/${encodeURIComponent(date)}`, { method: "DELETE" });
}

