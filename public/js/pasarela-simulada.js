import { api } from './api.js';
import { $, escapeHtml, money } from './ui.js';

const reference = new URLSearchParams(location.search).get('reference');

(async () => {
  try {
    const { data } = await api.paymentByReference(reference);
    $('#info').innerHTML = `<h2 style="margin:0 0 6px">${money(data.amount)}</h2>
      Vehículo <strong>${escapeHtml(data.plate)}</strong> · ${escapeHtml(data.client_name)}<br>
      <span class="muted">Referencia ${escapeHtml(data.reference)}</span>`;
    $('#actions').hidden = data.status !== 'PENDIENTE';
    if (data.status !== 'PENDIENTE') $('#info').innerHTML += `<p>Este pago ya está en estado ${escapeHtml(data.status)}.</p>`;
  } catch (error) {
    $('#info').textContent = error.message;
  }
})();

$('#actions').addEventListener('click', async (event) => {
  const button = event.target.closest('[data-outcome]');
  if (!button) return;
  button.disabled = true;
  try {
    await api.simulatePayment(reference, button.dataset.outcome);
    location.href = `/pago-resultado.html?ref=${encodeURIComponent(reference)}`;
  } catch (error) {
    $('#info').textContent = error.message;
    button.disabled = false;
  }
});
