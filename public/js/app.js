import { api } from './api.js';

const $ = (selector) => document.querySelector(selector);
const message = $('#message');

function notify(text, type = 'success') {
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
  window.setTimeout(() => { message.hidden = true; }, 4500);
}

function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

// Iteración 3: avisa si el vehículo no tiene mensualidad vigente. No bloquea la entrada (RN-25).
async function membershipWarning(plate) {
  try {
    const { data } = await api.membership(plate);
    if (data.membership_status === 'VIGENTE') return '';
    if (data.membership_status === 'POR_VENCER') {
      return ` Alerta: la mensualidad vence en ${data.days_left} día(s).`;
    }
    return ' Alerta: el vehículo no tiene mensualidad vigente.';
  } catch {
    return '';
  }
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

    tbody.innerHTML = data.map((vehicle) => `<tr>
      <td><strong class="plate">${escapeHtml(vehicle.plate)}</strong><span class="type">${escapeHtml(vehicle.vehicle_type)}</span></td>
      <td>${escapeHtml(vehicle.owner_name)}</td>
      <td>${dateTime(vehicle.entry_at)}</td>
      <td><button class="exit-btn" data-exit="${vehicle.movement_id}">Registrar salida</button></td>
    </tr>`).join('');

    tbody.querySelectorAll('[data-exit]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!confirm('¿Confirmas el registro de salida de este vehículo?')) return;
        button.disabled = true;
        try {
          const result = await api.exit(button.dataset.exit);
          notify(`Salida registrada. Tiempo aproximado: ${result.data.durationMinutes} minutos.`);
          await loadInside();
        } catch (error) {
          notify(error.message, 'error');
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4" class="empty">${escapeHtml(error.message)}. Verifica la conexión con el servidor y la base de datos.</td></tr>`;
  }
}

$('#entry-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const formElement = event.currentTarget; // se guarda antes del await: después vale null
  const form = new FormData(formElement);
  const button = formElement.querySelector('button[type="submit"]');
  const data = Object.fromEntries(form.entries());
  button.disabled = true;
  try {
    await api.entry(data);
    formElement.reset();
    const warning = await membershipWarning(data.plate);
    notify(`Entrada de ${data.plate.toUpperCase()} registrada correctamente.${warning}`, warning ? 'warning' : 'success');
    await loadInside();
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('#refresh').addEventListener('click', loadInside);

$('#history-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const plate = $('#history-plate').value.trim().toUpperCase();
  const target = $('#history-results');
  target.innerHTML = '<p class="muted">Consultando…</p>';
  try {
    const { data } = await api.history(plate);
    if (!data.length) {
      target.innerHTML = '<p class="muted">No se encontraron movimientos para esa placa.</p>';
      return;
    }
    target.innerHTML = `<table>
      <thead><tr><th>Placa</th><th>Entrada</th><th>Salida</th><th>Estado</th><th>Novedad de entrada</th></tr></thead>
      <tbody>${data.map((movement) => `<tr>
        <td><strong>${escapeHtml(movement.plate)}</strong></td>
        <td>${dateTime(movement.entry_at)}</td>
        <td>${dateTime(movement.exit_at)}</td>
        <td>${escapeHtml(movement.status)}</td>
        <td>${escapeHtml(movement.entry_notes || '—')}</td>
      </tr>`).join('')}</tbody>
    </table>`;
  } catch (error) {
    target.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
});

loadInside();
