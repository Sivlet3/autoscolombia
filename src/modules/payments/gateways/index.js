// Selecciona la pasarela según PAYMENT_GATEWAY (simulator | wompi)
function current() {
  const name = String(process.env.PAYMENT_GATEWAY || 'simulator').toLowerCase();
  if (name === 'wompi') return require('./wompi');
  if (name === 'simulator') return require('./simulator');
  const error = new Error('PAYMENT_GATEWAY no es válido (use simulator o wompi).');
  error.status = 502;
  throw error;
}

module.exports = { current };
