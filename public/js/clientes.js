import { api } from './api.js';
import { $, notify, escapeHtml, TYPE_LABELS } from './ui.js';

let selectedId = null;

async function loadClients() {
  const tbody = $('#clients-body');
  try {
    const { data } = await api.clients($('#search-term').value.trim());
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty">No se encontraron clientes.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((c) => {
      const active = c.status === 'ACTIVO';
      return `<tr>
        <td>${escapeHtml(c.document_type)} ${escapeHtml(c.document_number)}</td>
        <td>${escapeHtml(c.full_name)}</td><td>${escapeHtml(c.phone)}</td>
        <td>${escapeHtml(c.plates || '—')}</td>
        <td><span class="badge ${active ? 'ok' : 'off'}">${active ? 'Activo' : 'Inactivo'}</span></td>
        <td class="row-actions">
          <button type="button" class="secondary" data-view="${c.id}">Ver</button>
          <button type="button" class="secondary" data-status="${c.id}" data-action="${active ? 'inactivate' : 'reactivate'}">${active ? 'Inactivar' : 'Reactivar'}</button>
        </td></tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(e.message)}</td></tr>`;
  }
}

async function openDetail(id) {
  const { data } = await api.client(id);
  selectedId = data.id;
  $('#detail-title').textContent = data.full_name;
  $('#e-document-type').value = data.document_type;
  $('#e-document-number').value = data.document_number;
  $('#e-full-name').value = data.full_name;
  $('#e-phone').value = data.phone;
  $('#e-email').value = data.email || '';
  $('#vehicles-body').innerHTML = data.vehicles.length
    ? data.vehicles.map((v) => `<tr><td><strong class="plate">${escapeHtml(v.plate)}</strong></td><td>${escapeHtml(TYPE_LABELS[v.vehicle_type] || v.vehicle_type)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="empty">Este cliente aún no tiene vehículos asociados.</td></tr>';
  $('#detail-panel').hidden = false;
}

$('#client-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const result = await api.createClient(Object.fromEntries(new FormData(form).entries()));
    form.reset();
    notify(result.message);
    await loadClients();
  } catch (e) { notify(e.message, 'error'); }
  finally { button.disabled = false; }
});

$('#search-form').addEventListener('submit', (event) => { event.preventDefault(); loadClients(); });

$('#clients-body').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  try {
    if (button.dataset.view) {
      await openDetail(button.dataset.view);
    } else if (button.dataset.status) {
      const inactivate = button.dataset.action === 'inactivate';
      if (!confirm(inactivate ? '¿Confirmas inactivar a este cliente?' : '¿Confirmas reactivar a este cliente?')) return;
      button.disabled = true;
      const result = inactivate ? await api.inactivateClient(button.dataset.status) : await api.reactivateClient(button.dataset.status);
      notify(result.message);
      await loadClients();
      if (selectedId === Number(button.dataset.status)) await openDetail(selectedId);
    }
  } catch (e) { notify(e.message, 'error'); button.disabled = false; }
});

$('#edit-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await api.updateClient(selectedId, Object.fromEntries(new FormData(event.currentTarget).entries()));
    notify(result.message);
    await loadClients();
    await openDetail(selectedId);
  } catch (e) { notify(e.message, 'error'); }
});

$('#vehicle-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const result = await api.addClientVehicle(selectedId, Object.fromEntries(new FormData(form).entries()));
    form.reset();
    notify(result.message);
    await loadClients();
    await openDetail(selectedId);
  } catch (e) { notify(e.message, 'error'); }
});

loadClients();
