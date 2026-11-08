import { api } from './api.js';
import { $, notify, escapeHtml, TYPE_LABELS } from './ui.js';

let cells = [];
let selectedId = null;

const CSS = { LIBRE: 'free', OCUPADA: 'busy', INACTIVA: 'off' };
const STATE_TEXT = { LIBRE: 'libre', OCUPADA: 'ocupada', INACTIVA: 'inactiva' };

async function load() {
  const grid = $('#cell-grid');
  try {
    const { data } = await api.cells({ type: $('#filter-type').value, status: $('#filter-status').value });
    cells = data.cells;
    $('#count-free').textContent = data.summary.LIBRE;
    $('#count-busy').textContent = data.summary.OCUPADA;
    $('#count-off').textContent = data.summary.INACTIVA;
    grid.innerHTML = cells.length
      ? cells.map((c) => `<button type="button" class="cell ${CSS[c.status]}${c.id === selectedId ? ' selected' : ''}" data-id="${c.id}" aria-pressed="${c.id === selectedId}">
          <strong>${escapeHtml(c.code)}</strong><span>${escapeHtml(c.plate || STATE_TEXT[c.status])}</span></button>`).join('')
      : '<p class="muted">No hay celdas que coincidan con el filtro.</p>';
    renderPanel();
  } catch (e) {
    grid.innerHTML = `<p class="muted">${escapeHtml(e.message)}. Verifica la conexión con el servidor y MySQL.</p>`;
  }
}

function renderPanel() {
  const cell = cells.find((c) => c.id === selectedId);
  $('#cell-panel').hidden = !cell;
  if (!cell) return;
  $('#cell-title').textContent = `Celda ${cell.code}`;
  $('#cell-info').textContent = `Estado: ${STATE_TEXT[cell.status]} · Tipo: ${(TYPE_LABELS[cell.cell_type] || cell.cell_type).toLowerCase()}${cell.plate ? ` · Placa: ${cell.plate}` : ''}`;
  $('#btn-assign').disabled = cell.status !== 'LIBRE';
  $('#btn-release').disabled = cell.status !== 'OCUPADA';
  const toggle = $('#btn-toggle');
  toggle.textContent = cell.status === 'INACTIVA' ? 'Reactivar celda' : 'Inactivar celda';
  toggle.disabled = cell.status === 'OCUPADA';
  $('#edit-code').value = cell.code;
  $('#edit-type').value = cell.cell_type;
  $('#assign-form').hidden = true;
  $('#edit-form').hidden = true;
}

async function run(action, confirmText) {
  if (confirmText && !confirm(confirmText)) return;
  try {
    const result = await action();
    notify(result.message);
    await load();
  } catch (e) { notify(e.message, 'error'); }
}

$('#cell-grid').addEventListener('click', (event) => {
  const button = event.target.closest('[data-id]');
  if (!button) return;
  selectedId = Number(button.dataset.id);
  load();
});
$('#filter-type').addEventListener('change', load);
$('#filter-status').addEventListener('change', load);
$('#btn-new').addEventListener('click', () => { $('#new-panel').hidden = !$('#new-panel').hidden; });

$('#new-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await run(async () => {
    const result = await api.createCell(Object.fromEntries(new FormData(form).entries()));
    form.reset();
    return result;
  });
});

$('#btn-edit').addEventListener('click', () => { $('#edit-form').hidden = !$('#edit-form').hidden; $('#assign-form').hidden = true; });
$('#btn-assign').addEventListener('click', () => { $('#assign-form').hidden = !$('#assign-form').hidden; $('#edit-form').hidden = true; });
$('#btn-release').addEventListener('click', () => run(() => api.releaseCell(selectedId), '¿Confirmas liberar esta celda?'));
$('#btn-toggle').addEventListener('click', () => {
  const cell = cells.find((c) => c.id === selectedId);
  if (cell.status === 'INACTIVA') run(() => api.reactivateCell(selectedId), '¿Confirmas reactivar esta celda?');
  else run(() => api.inactivateCell(selectedId), '¿Confirmas inactivar esta celda?');
});

$('#assign-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await run(async () => {
    const result = await api.assignCell(selectedId, Object.fromEntries(new FormData(form).entries()));
    form.reset();
    return result;
  });
});
$('#edit-form').addEventListener('submit', (event) => {
  event.preventDefault();
  run(() => api.updateCell(selectedId, Object.fromEntries(new FormData(event.currentTarget).entries())));
});

load();
