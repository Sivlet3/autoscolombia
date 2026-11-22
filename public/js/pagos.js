import { api } from './api.js';
import {
  $, notify, escapeHtml, money, dateTime, dateOnly, badge, TYPE_LABELS, PAYMENT_STATUS, MEMBERSHIP_STATUS
} from './ui.js';

let rates = {};
let current = null; // vehículo consultado

async function loadRates() {
  const { data } = await api.rates();
  data.forEach((rate) => { rates[rate.vehicle_type] = rate.amount; });
}

// ---------- Consultar placa y mostrar resumen ----------
async function lookup(plate) {
  $('#result').hidden = true;
  try {
    const { data } = await api.membership(plate);
    current = data;
    const rate = rates[data.vehicle_type];
    const blocked = !data.client_id ? 'El vehículo no está asociado a un cliente.'
      : data.client_status !== 'ACTIVO' ? 'El cliente está inactivo.' : '';
    $('#summary').innerHTML = `<dl>
      <dt>Vehículo</dt><dd>${escapeHtml(data.plate)} · ${escapeHtml(TYPE_LABELS[data.vehicle_type] || data.vehicle_type)}</dd>
      <dt>Cliente</dt><dd>${escapeHtml(data.full_name || '—')}</dd>
      <dt>Mensualidad</dt><dd>${badge(MEMBERSHIP_STATUS, data.membership_status)}${data.valid_until ? ` hasta ${dateOnly(data.valid_until)}` : ''}</dd>
      <dt>Valor a cobrar</dt><dd>${money(rate)}</dd></dl>
      ${blocked ? `<p class="muted" style="margin:10px 0 0;color:#a74738">${blocked}</p>` : ''}`;
    $('#summary').hidden = false;
    $('#pay-form').hidden = Boolean(blocked);
    $('#pay-button').firstChild.textContent = `Cobrar ${money(rate)} `;
  } catch (error) {
    current = null;
    $('#summary').hidden = true;
    $('#pay-form').hidden = true;
    notify(error.message, 'error');
  }
}

$('#lookup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  lookup($('#plate').value.trim());
});

// ---------- Crear el pago ----------
$('#pay-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const method = new FormData(event.currentTarget).get('method');
  const button = $('#pay-button');
  button.disabled = true;
  try {
    const { data, message } = await api.createPayment({ plate: current.plate, method });
    notify(message);
    renderResult(data);
    await Promise.all([loadPayments(), lookup(current.plate)]);
    $('#result').hidden = false;
  } catch (error) {
    notify(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

function renderResult(payment) {
  const target = $('#result');
  if (payment.method === 'EFECTIVO') {
    target.className = 'result-card';
    target.innerHTML = `<h4>Pago en efectivo registrado</h4>
      <p class="muted">Referencia ${escapeHtml(payment.reference)} · ${money(payment.amount)}. La mensualidad quedó activa.</p>
      <a class="link-button" href="/comprobante.html?id=${payment.id}" target="_blank" rel="noopener">Ver comprobante</a>`;
  } else {
    target.className = 'result-card pending';
    target.innerHTML = `<h4>Pago creado: falta completarlo en la pasarela</h4>
      <p class="muted">Referencia ${escapeHtml(payment.reference)} · ${money(payment.amount)}. El cliente debe pagar en la pasarela; la mensualidad se activa cuando se confirme.</p>
      <p><a class="link-button" href="${escapeHtml(payment.checkoutUrl)}">Ir a la pasarela →</a>
      <button type="button" class="secondary" id="copy-link">Copiar enlace</button></p>`;
    $('#copy-link').addEventListener('click', async () => {
      await navigator.clipboard.writeText(payment.checkoutUrl);
      notify('Enlace de pago copiado.');
    });
  }
}

// ---------- Historial ----------
async function loadPayments() {
  const tbody = $('#payments-body');
  try {
    const { data } = await api.payments({ q: $('#search-term').value.trim(), status: $('#filter-status').value });
    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty">No se encontraron pagos.</td></tr>';
      return;
    }
    tbody.innerHTML = data.map((p) => `<tr>
      <td><strong>${escapeHtml(p.reference)}</strong></td>
      <td><span class="plate">${escapeHtml(p.plate)}</span></td>
      <td>${escapeHtml(p.client_name)}</td>
      <td>${money(p.amount)}</td>
      <td>${p.method === 'EFECTIVO' ? 'Efectivo' : 'Pasarela'}</td>
      <td>${badge(PAYMENT_STATUS, p.status)}</td>
      <td>${dateTime(p.created_at)}</td>
      <td><div class="row-actions">
        <a class="link-button secondary" style="padding:8px 10px;font-size:11px" href="/comprobante.html?id=${p.id}" target="_blank" rel="noopener">Ver</a>
        ${p.status === 'PENDIENTE' ? `
          <button type="button" class="secondary" data-sync="${p.id}">Actualizar</button>
          <button type="button" class="exit-btn" data-cancel="${p.id}">Anular</button>` : ''}
      </div></td></tr>`).join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">${escapeHtml(error.message)}</td></tr>`;
  }
}

$('#search-form').addEventListener('submit', (event) => { event.preventDefault(); loadPayments(); });

$('#payments-body').addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  try {
    if (button.dataset.sync) {
      const { data } = await api.syncPayment(button.dataset.sync);
      notify(data.status === 'PENDIENTE' ? 'El pago sigue pendiente en la pasarela.' : `Pago ${PAYMENT_STATUS[data.status].text.toLowerCase()}.`,
        data.status === 'PENDIENTE' ? 'warning' : 'success');
    } else if (button.dataset.cancel) {
      if (!confirm('¿Confirmas anular este pago pendiente?')) return;
      await api.cancelPayment(button.dataset.cancel);
      notify('Pago anulado correctamente.');
    }
    await loadPayments();
    if (current) await lookup(current.plate);
  } catch (error) {
    notify(error.message, 'error');
  }
});

(async () => {
  await loadRates();
  await loadPayments();
  const plate = new URLSearchParams(location.search).get('plate');
  if (plate) {
    $('#plate').value = plate;
    await lookup(plate);
  }
})();
