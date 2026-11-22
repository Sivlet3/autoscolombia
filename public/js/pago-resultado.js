import { api } from './api.js';
import { $, escapeHtml, money, badge, PAYMENT_STATUS } from './ui.js';

const params = new URLSearchParams(location.search);
const reference = params.get('ref');
const transactionId = params.get('id') || ''; // lo agrega Wompi al volver
let attempts = 0;

const TEXT = {
  APROBADO: ['✅', 'Pago aprobado', 'La mensualidad quedó activa. Gracias por tu pago.'],
  PENDIENTE: ['⏳', 'Pago pendiente', 'Estamos esperando la confirmación de la pasarela. Esta página se actualiza sola.'],
  RECHAZADO: ['❌', 'Pago rechazado', 'La pasarela no aprobó el pago. Puedes intentarlo de nuevo.'],
  ANULADO: ['⚪', 'Pago anulado', 'Este pago fue anulado.'],
  ERROR: ['⚠️', 'Error en el pago', 'Ocurrió un error al procesar el pago. Puedes intentarlo de nuevo.']
};

async function load() {
  const card = $('#card');
  if (!reference) {
    card.innerHTML = '<p class="muted">Falta la referencia del pago.</p>';
    return;
  }
  try {
    const { data } = await api.paymentByReference(reference, transactionId);
    const [icon, title, text] = TEXT[data.status] || TEXT.ERROR;
    card.innerHTML = `<div class="big">${icon}</div><h2>${title}</h2><p class="muted">${text}</p>
      <p>${badge(PAYMENT_STATUS, data.status)}</p>
      <p><strong>${money(data.amount)}</strong> · ${escapeHtml(data.plate)}<br><span class="muted">Referencia ${escapeHtml(data.reference)}</span></p>
      <p>${data.status === 'APROBADO' ? `<a class="link-button" href="/comprobante.html?id=${data.id}">Ver comprobante</a> ` : ''}
      ${['RECHAZADO', 'ERROR', 'ANULADO'].includes(data.status) ? `<a class="link-button" href="/pagos.html?plate=${encodeURIComponent(data.plate)}">Intentar de nuevo</a> ` : ''}
      <a class="link-button secondary" href="/pagos.html">Volver a pagos</a></p>`;
    if (data.status === 'PENDIENTE' && attempts++ < 12) window.setTimeout(load, 5000);
  } catch (error) {
    card.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
}
load();
