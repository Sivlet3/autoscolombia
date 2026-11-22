import { api } from './api.js';
import { $, escapeHtml, money, dateTime, badge, TYPE_LABELS, PAYMENT_STATUS } from './ui.js';

const id = new URLSearchParams(location.search).get('id');

(async () => {
  try {
    const { data: p } = await api.payment(id);
    const approved = p.status === 'APROBADO';
    $('#receipt').innerHTML = `
      <p class="eyebrow">AUTOS COLOMBIA</p>
      <h2>${approved ? 'Comprobante de pago' : 'Detalle del pago'}</h2>
      <p>${badge(PAYMENT_STATUS, p.status)}</p>
      <dl>
        <dt>Referencia</dt><dd>${escapeHtml(p.reference)}</dd>
        <dt>Concepto</dt><dd>Mensualidad de parqueadero</dd>
        <dt>Cliente</dt><dd>${escapeHtml(p.client_name)} · ${escapeHtml(p.document_type)} ${escapeHtml(p.document_number)}</dd>
        <dt>Vehículo</dt><dd>${escapeHtml(p.plate)} · ${escapeHtml(TYPE_LABELS[p.vehicle_type] || p.vehicle_type)}</dd>
        <dt>Método</dt><dd>${p.method === 'EFECTIVO' ? 'Efectivo' : `Pasarela ${escapeHtml(p.gateway || '')}`}</dd>
        <dt>Creado</dt><dd>${dateTime(p.created_at)}</dd>
        <dt>${approved ? 'Pagado' : 'Pago'}</dt><dd>${approved ? dateTime(p.paid_at) : '—'}</dd>
        <dt>Valor</dt><dd class="total">${money(p.amount)}</dd>
      </dl>
      <p class="muted">Las llaves y datos de tarjeta nunca se guardan en este sistema; solo la referencia y el estado.</p>`;
    $('#print').hidden = false;
    $('#print').addEventListener('click', () => window.print());
  } catch (error) {
    $('#receipt').innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
  }
})();
