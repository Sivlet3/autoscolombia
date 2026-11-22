-- Autos Colombia · Iteración 3: gestión de pagos (PostgreSQL)
-- Ejecutar DESPUÉS de schema.sql. No borra ni cambia los datos de las iteraciones 1 y 2.

-- 1. Tipos ENUM nuevos
CREATE TYPE payment_status_enum AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO', 'ERROR');
CREATE TYPE payment_method_enum AS ENUM ('PASARELA', 'EFECTIVO');

-- 2. Tarifas mensuales por tipo de vehículo (valores en pesos colombianos)
CREATE TABLE IF NOT EXISTS monthly_rates (
  vehicle_type vehicle_type_enum PRIMARY KEY,
  amount BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rate_amount CHECK (amount > 0)
);
INSERT INTO monthly_rates (vehicle_type, amount) VALUES
  ('AUTOMOVIL', 180000), ('MOTOCICLETA', 90000), ('CAMIONETA', 220000), ('OTRO', 150000)
ON CONFLICT (vehicle_type) DO NOTHING;

-- 3. Pagos
--    RN-18: la referencia es única y se envía a la pasarela
--    RN-20: un vehículo no puede tener dos pagos PENDIENTE a la vez
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  reference VARCHAR(40) NOT NULL,
  client_id BIGINT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  concept VARCHAR(20) NOT NULL DEFAULT 'MENSUALIDAD',
  amount BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'COP',
  method payment_method_enum NOT NULL,
  gateway VARCHAR(20),
  gateway_transaction_id VARCHAR(80),
  status payment_status_enum NOT NULL DEFAULT 'PENDIENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMPTZ,
  CONSTRAINT uq_payments_reference UNIQUE (reference),
  CONSTRAINT chk_payment_amount CHECK (amount > 0),
  CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_payment_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT chk_payment_paid CHECK (
    (status = 'APROBADO' AND paid_at IS NOT NULL) OR (status <> 'APROBADO' AND paid_at IS NULL)
  ),
  CONSTRAINT chk_payment_gateway CHECK (
    (method = 'PASARELA' AND gateway IS NOT NULL) OR (method = 'EFECTIVO' AND gateway IS NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_pending_vehicle ON payments (vehicle_id) WHERE status = 'PENDIENTE';
CREATE INDEX IF NOT EXISTS ix_payments_vehicle ON payments (vehicle_id);
CREATE INDEX IF NOT EXISTS ix_payments_created ON payments (created_at DESC);

-- 4. Mensualidades: una fila por pago aprobado (RN-19: un pago aprobado extiende un mes)
CREATE TABLE IF NOT EXISTS memberships (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  client_id BIGINT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  valid_from DATE NOT NULL,
  valid_until DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_membership_payment UNIQUE (payment_id),
  CONSTRAINT fk_membership_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT fk_membership_client FOREIGN KEY (client_id) REFERENCES clients(id),
  CONSTRAINT fk_membership_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT chk_membership_dates CHECK (valid_until >= valid_from)
);
CREATE INDEX IF NOT EXISTS ix_memberships_vehicle ON memberships (vehicle_id, valid_until DESC);

-- 5. Bitácora de eventos de cada pago (auditoría de la pasarela)
CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL,
  event_type VARCHAR(30) NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_event_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
);
CREATE INDEX IF NOT EXISTS ix_payment_events_payment ON payment_events (payment_id);
