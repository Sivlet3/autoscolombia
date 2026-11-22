export const $ = (selector) => document.querySelector(selector);

export const TYPE_LABELS = {
  AUTOMOVIL: 'Automóvil',
  MOTOCICLETA: 'Motocicleta',
  CAMIONETA: 'Camioneta',
  OTRO: 'Otro'
};

// Iteración 3: pagos y mensualidades
export const PAYMENT_STATUS = {
  PENDIENTE: { text: 'Pendiente', css: 'warn' },
  APROBADO: { text: 'Aprobado', css: 'ok' },
  RECHAZADO: { text: 'Rechazado', css: 'bad' },
  ANULADO: { text: 'Anulado', css: 'off' },
  ERROR: { text: 'Error', css: 'bad' }
};
export const MEMBERSHIP_STATUS = {
  VIGENTE: { text: 'Vigente', css: 'ok' },
  POR_VENCER: { text: 'Por vencer', css: 'warn' },
  VENCIDA: { text: 'Vencida', css: 'bad' },
  SIN_MENSUALIDAD: { text: 'Sin mensualidad', css: 'off' }
};

export function badge(map, key) {
  const item = map[key] || { text: key, css: 'off' };
  return `<span class="badge ${item.css}">${item.text}</span>`;
}

export function money(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function dateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

// Fecha AAAA-MM-DD (columna DATE) sin desfase de zona horaria
export function dateOnly(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

let timer;

export function notify(text, type = 'success') {
  const message = $('#message');
  message.textContent = text;
  message.className = `message ${type}`;
  message.hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    message.hidden = true;
  }, 4500);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}
