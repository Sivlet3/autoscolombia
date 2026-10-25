import { api } from './api.js';

const $ = (selector) => document.querySelector(selector);
const message = $('#message');

function notify(text, type = 'success') {
  message.textContent = text;
  message.className = message ${type};
  message.hidden = false;
  window.setTimeout(() => { message.hidden = true; }, 4500);
}
function dateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function loadInside() {
  const tbody = $('#inside-body');
  try {
    const { data } = await api.inside();
    $('#inside-count').textContent = data.length;
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No hay vehículos registrados dentro.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((v) => <tr>
      <td><strong class="plate">${escapeHtml(v.plate)}</strong><span class="type">${escapeHtml(v.vehicle_type)}</span></td>
      <td>${escapeHtml(v.owner_name)}</td><td>${dateTime(v.entry_at)}</td>
      <td><button class="exit-btn" data-exit="${v.movement_id}">Registrar salida</button></td>
    </tr>).join('');
    tbody.querySelectorAll('[data-exit]').forEach((button) => button.addEventListener('click', async () => {
      if (!confirm('¿Confirmas el registro de salida de este vehículo?')) return;
      button.disabled = true;
      try {
        const result = await api.exit(button.dataset.exit);
        notify(Salida registrada. Tiempo aproximado: ${result.data.durationMinutes} minutos.);
        await loadInside();
      } catch (e) { notify(e.message, 'error'); button.disabled = false; }
    }));
  } catch (e) {
    tbody.innerHTML = <tr><td colspan="4" class="empty">${escapeHtml(e.message)}. Verifica la conexión con el servidor y MySQL.</td></tr>;
  }
}
$('#entry-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const data = Object.fromEntries(form.entries());
  button.disabled = true;
  try {
    await api.entry(data);
    event.currentTarget.reset();
    notify(Entrada de ${data.plate.toUpperCase()} registrada correctamente.);
    await loadInside();
  } catch (e) { notify(e.message, 'error'); }
  finally { button.disabled = false; }
});
$('#refresh').addEventListener('click', loadInside);
$('#history-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const plate = $('#history-plate').value.trim().toUpperCase();
  const target = $('#history-results');
  target.innerHTML = '<p class="muted">Consultando…</p>';
  try {
    const { data } = await api.history(plate);
    if (!data.length) { target.innerHTML = '<p class="muted">No se encontraron movimientos para esa placa.</p>'; return; }
    target.innerHTML = <table><thead><tr><th>Placa</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Novedad de entrada</th></tr></thead><tbody>${data.map(x => <tr><td><strong>${escapeHtml(x.plate)}</strong></td><td>${dateTime(x.entry_at)}</td><td>${dateTime(x.exit_at)}</td><td>${escapeHtml(x.status)}</td><td>${escapeHtml(x.entry_notes || '—')}</td></tr>).join('')}</tbody></table>;
  } catch (e) { target.innerHTML = <p class="muted">${escapeHtml(e.message)}</p>; }
});
loadInside();
