import { api } from './api.js';
import { $, notify, escapeHtml, dateOnly, badge, TYPE_LABELS, MEMBERSHIP_STATUS } from './ui.js';

const chargeLink = (plate) =>
  `<a class="link-button secondary" style="padding:8px 10px;font-size:11px" href="/pagos.html?plate=${encodeURIComponent(plate)}">Cobrar</a>`;

async function load() {
  const tbody = $('#memberships-body');
  try {
    const { data } = await api.memberships($('#filter-status').value);
    tbody.innerHTML = data.length ? data.map((m) => `<tr>
      <td><span class="plate">${escapeHtml(m.plate)}</span></td>
      <td>${escapeHtml(m.full_name)}</td>
      <td>${escapeHtml(TYPE_LABELS[m.vehicle_type] || m.vehicle_type)}</td>
      <td>${dateOnly(m.valid_until)}</td>
      <td>${m.days_left === null ? '—' : m.days_left}</td>
      <td>${badge(MEMBERSHIP_STATUS, m.membership_status)}</td>
      <td>${m.client_status === 'ACTIVO' ? chargeLink(m.plate) : '<span class="muted">Cliente inactivo</span>'}</td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty">No hay mensualidades con ese estado.</td></tr>';
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">${escapeHtml(error.message)}</td></tr>`;
  }
}

$('#filter-form').addEventListener('submit', (event) => { event.preventDefault(); load(); });

$('#plate-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const box = $('#plate-result');
  try {
    const { data: m } = await api.membership($('#plate').value.trim());
    box.innerHTML = `<dl>
      <dt>Vehículo</dt><dd>${escapeHtml(m.plate)} · ${escapeHtml(TYPE_LABELS[m.vehicle_type] || m.vehicle_type)}</dd>
      <dt>Cliente</dt><dd>${escapeHtml(m.full_name || 'Sin cliente asociado')}</dd>
      <dt>Estado</dt><dd>${badge(MEMBERSHIP_STATUS, m.membership_status)}</dd>
      <dt>Vence</dt><dd>${dateOnly(m.valid_until)}${m.days_left === null ? '' : ` (${m.days_left} días)`}</dd></dl>
      ${m.client_id && m.client_status === 'ACTIVO' ? `<p style="margin:12px 0 0">${chargeLink(m.plate)}</p>` : ''}`;
    box.hidden = false;
  } catch (error) {
    box.hidden = true;
    notify(error.message, 'error');
  }
});

load();
