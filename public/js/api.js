async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'No fue posible completar la solicitud.');
  return payload;
}

const send = (method, path, data) =>
  request(path, { method, body: data === undefined ? undefined : JSON.stringify(data) });

export const api = {
  // Iteración 1: vehículos
  entry: (data) => request('/api/vehicles/entry', { method: 'POST', body: JSON.stringify(data) }),
  inside: () => request('/api/vehicles/inside'),
  exit: (id, notes = '') => request(`/api/vehicles/${id}/exit`, { method: 'POST', body: JSON.stringify({ notes }) }),
  history: (plate) => request(`/api/vehicles/history?plate=${encodeURIComponent(plate)}`),

  // Iteración 2: clientes
  clients: (term = '') => request(`/api/clients?q=${encodeURIComponent(term)}`),
  client: (id) => request(`/api/clients/${id}`),
  createClient: (data) => send('POST', '/api/clients', data),
  updateClient: (id, data) => send('PUT', `/api/clients/${id}`, data),
  inactivateClient: (id) => send('POST', `/api/clients/${id}/inactivate`),
  reactivateClient: (id) => send('POST', `/api/clients/${id}/reactivate`),
  addClientVehicle: (id, data) => send('POST', `/api/clients/${id}/vehicles`, data),

  // Iteración 2: celdas
  cells: ({ type = '', status = '' } = {}) =>
    request(`/api/cells?type=${encodeURIComponent(type)}&status=${encodeURIComponent(status)}`),
  createCell: (data) => send('POST', '/api/cells', data),
  updateCell: (id, data) => send('PUT', `/api/cells/${id}`, data),
  inactivateCell: (id) => send('POST', `/api/cells/${id}/inactivate`),
  reactivateCell: (id) => send('POST', `/api/cells/${id}/reactivate`),
  assignCell: (id, data) => send('POST', `/api/cells/${id}/assign`, data),
  releaseCell: (id) => send('POST', `/api/cells/${id}/release`)
};
