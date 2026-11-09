export const $ = (selector) => document.querySelector(selector);

export const TYPE_LABELS = { AUTOMOVIL: 'Automóvil', MOTOCICLETA: 'Motocicleta', CAMIONETA: 'Camioneta', OTRO: 'Otro' };

let timer;
export function notify(text, type = 'success') {
  const message = $('#message');
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => { message.hidden = true; }, 4500);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
