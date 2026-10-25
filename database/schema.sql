/*CREATE DATABASE autos_colombia
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Colombia.utf8'
    LC_CTYPE = 'Spanish_Colombia.utf8'; 


-- 1. Crear tipo ENUM para vehicle_type
CREATE TYPE vehicle_type_enum AS ENUM ('AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA', 'OTRO');

-- 2. Crear tipo ENUM para movement_status
CREATE TYPE movement_status_enum AS ENUM ('INSIDE', 'CLOSED');

-- 3. Tabla: vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id BIGSERIAL PRIMARY KEY,
  plate VARCHAR(10) NOT NULL,
  vehicle_type vehicle_type_enum NOT NULL DEFAULT 'AUTOMOVIL',
  owner_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_vehicles_plate UNIQUE (plate),
  CONSTRAINT chk_vehicle_plate CHECK (CHAR_LENGTH(plate) BETWEEN 5 AND 10)
);

-- 4. Tabla: parking_movements
CREATE TABLE IF NOT EXISTS parking_movements (
  id BIGSERIAL PRIMARY KEY,
  vehicle_id BIGINT NOT NULL,
  entry_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  exit_at TIMESTAMP NULL,
  entry_notes VARCHAR(500) NULL,
  exit_notes VARCHAR(500) NULL,
  status movement_status_enum NOT NULL DEFAULT 'INSIDE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_movement_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  CONSTRAINT chk_movement_dates CHECK (exit_at IS NULL OR exit_at >= entry_at),
  CONSTRAINT chk_movement_status CHECK (
    (status = 'INSIDE' AND exit_at IS NULL) OR
    (status = 'CLOSED' AND exit_at IS NOT NULL)
  )
);

-- 5. Crear índices en PostgreSQL
CREATE INDEX ix_movement_vehicle ON parking_movements (vehicle_id);
CREATE INDEX ix_movement_status_entry ON parking_movements (status, entry_at);
ls
