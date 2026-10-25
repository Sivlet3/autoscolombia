async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No fue posible completar la solicitud.');
  return payload;
}
export const api = {
  entry: (data) => request('/api/vehicles/entry', { method: 'POST', body: JSON.stringify(data) }),
  inside: () => request('/api/vehicles/inside'),
  exit: (id, notes = '') => request(/api/vehicles/${id}/exit, { method: 'POST', body: JSON.stringify({ notes }) }),
  history: (plate) => request(/api/vehicles/history?plate=${encodeURIComponent(plate)})
};
