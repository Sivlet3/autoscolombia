const test = require('node:test');
const assert = require('node:assert');
const { sha256, buildChecksum, verifyEvent, normalizeTransaction } = require('../src/modules/payments/gateways/wompi-events');
const simulator = require('../src/modules/payments/gateways/simulator');
const wompi = require('../src/modules/payments/gateways/wompi');

// Ejemplos de la documentación oficial de Wompi
const OFFICIAL_EVENT = {
  event: 'transaction.updated',
  data: { transaction: { id: '1234-1610641025-49201', status: 'APPROVED', amount_in_cents: 4490000 } },
  signature: { properties: ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'] },
  timestamp: 1530291411
};
const EVENTS_SECRET = 'prod_events_OcHnIzeBl5socpwByQ4hA52Em3USQ93Z';

test('checksum del evento = SHA-256(valores + timestamp + secreto)', () => {
  const expected = sha256('1234-1610641025-49201APPROVED44900001530291411' + EVENTS_SECRET);
  assert.strictEqual(buildChecksum(OFFICIAL_EVENT, EVENTS_SECRET), expected);
});

test('verifyEvent acepta un evento firmado y rechaza uno alterado', () => {
  const event = JSON.parse(JSON.stringify(OFFICIAL_EVENT));
  event.signature.checksum = buildChecksum(event, EVENTS_SECRET);
  assert.ok(verifyEvent(event, event.signature.checksum, EVENTS_SECRET));
  event.data.transaction.status = 'DECLINED';
  assert.ok(!verifyEvent(event, event.signature.checksum, EVENTS_SECRET));
  assert.ok(!verifyEvent(event, '', 'otro-secreto'));
});

test('firma de integridad = SHA-256(referencia + centavos + moneda + secreto)', () => {
  process.env.WOMPI_INTEGRITY_SECRET = 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6';
  assert.strictEqual(
    wompi.integritySignature({ reference: 'sk8-438k4-xmxm392-sn2m', amountInCents: 2490000, currency: 'COP' }),
    '37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5'
  );
});

test('el enlace de Wompi lleva monto en centavos, referencia y firma', () => {
  process.env.WOMPI_PUBLIC_KEY = 'pub_test_abc';
  process.env.WOMPI_INTEGRITY_SECRET = 'test_integrity_abc';
  const { checkoutUrl } = wompi.createCheckout({
    reference: 'AC-1', amount: 180000, currency: 'COP', redirectUrl: 'http://localhost:3000/pago-resultado.html?ref=AC-1',
    customer: { email: 'a@b.co', fullName: 'Ana Pérez', phone: '3001234567', documentType: 'CC', documentNumber: '123456' }
  });
  const url = new URL(checkoutUrl);
  assert.strictEqual(url.origin + url.pathname, 'https://checkout.wompi.co/p/');
  assert.strictEqual(url.searchParams.get('amount-in-cents'), '18000000');
  assert.strictEqual(url.searchParams.get('reference'), 'AC-1');
  assert.strictEqual(url.searchParams.get('currency'), 'COP');
  assert.strictEqual(url.searchParams.get('public-key'), 'pub_test_abc');
  assert.strictEqual(url.searchParams.get('signature:integrity'), sha256('AC-118000000COPtest_integrity_abc'));
  assert.strictEqual(url.searchParams.get('customer-data:legal-id-type'), 'CC');
});

test('Wompi exige las llaves configuradas', () => {
  delete process.env.WOMPI_EVENTS_SECRET;
  assert.throws(() => wompi.parseWebhook({}, OFFICIAL_EVENT), /WOMPI_EVENTS_SECRET/);
});

test('normalizeTransaction convierte estados y centavos a pesos', () => {
  const n = normalizeTransaction({ id: 'T1', reference: 'AC-9', status: 'DECLINED', amount_in_cents: 9000000 }, 'WEBHOOK');
  assert.deepStrictEqual([n.status, n.amount, n.reference], ['RECHAZADO', 90000, 'AC-9']);
  assert.strictEqual(normalizeTransaction({ status: 'RARO', amount_in_cents: 100 }, 'SYNC').status, 'PENDIENTE');
});

test('el simulador genera eventos que su propio verificador acepta', () => {
  const event = simulator.buildEvent({ reference: 'AC-5', amount: 180000 }, 'approved');
  const parsed = simulator.parseWebhook({}, event);
  assert.deepStrictEqual([parsed.status, parsed.amount, parsed.reference], ['APROBADO', 180000, 'AC-5']);
  event.data.transaction.amount_in_cents = 1;
  assert.throws(() => simulator.parseWebhook({}, event), /firma/);
  assert.strictEqual(simulator.buildEvent({ reference: 'x', amount: 1 }, 'raro'), null);
});
