/*-- Database: autos_colombia

-- DROP DATABASE IF EXISTS autos_colombia;

CREATE DATABASE autos_colombia
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'Spanish_Colombia.utf8'
    LC_CTYPE = 'Spanish_Colombia.utf8'
    LOCALE_PROVIDER = 'libc'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

	-- Tipos ENUM
CREATE TYPE vehicle_type_enum AS ENUM ('AUTOMOVIL', 'MOTOCICLETA', 'CAMIONETA', 'OTRO');
CREATE TYPE movement_status_enum AS ENUM ('INSIDE', 'CLOSED');
CREATE TYPE client_status_enum AS ENUM ('ACTIVO', 'INACTIVO');
CREATE TYPE cell_status_enum AS ENUM ('LIBRE', 'OCUPADA', 'INACTIVA');

-- 1. Tabla: clients
CREATE TABLE clients (
    id BIGSERIAL PRIMARY KEY,
    document_type VARCHAR(15) NOT NULL,
    document_number VARCHAR(20) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(120) NULL,
    status client_status_enum NOT NULL DEFAULT 'ACTIVO',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_clients_document UNIQUE (document_type, document_number),
    CONSTRAINT chk_client_document_type CHECK (document_type IN ('CC', 'CE', 'PASAPORTE'))
);

-- 2. Tabla: vehicles
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    plate VARCHAR(10) NOT NULL,
    vehicle_type vehicle_type_enum NOT NULL DEFAULT 'AUTOMOVIL',
    owner_name VARCHAR(120) NOT NULL,
    client_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vehicles_plate UNIQUE (plate),
    CONSTRAINT fk_vehicle_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
    CONSTRAINT chk_vehicle_plate CHECK (CHAR_LENGTH(plate) BETWEEN 5 AND 10)
);

CREATE INDEX ix_vehicle_client ON vehicles (client_id);

-- 3. Tabla: cells
CREATE TABLE cells (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    cell_type vehicle_type_enum NOT NULL DEFAULT 'AUTOMOVIL',
    status cell_status_enum NOT NULL DEFAULT 'LIBRE',
    vehicle_id BIGINT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_cells_code UNIQUE (code),
    CONSTRAINT uq_cells_vehicle UNIQUE (vehicle_id),
    CONSTRAINT fk_cell_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    CONSTRAINT chk_cell_assignment CHECK (
        (status = 'OCUPADA' AND vehicle_id IS NOT NULL) OR
        (status <> 'OCUPADA' AND vehicle_id IS NULL)
    )
);

CREATE INDEX ix_cells_status ON cells (status);

-- 4. Tabla: parking_movements
CREATE TABLE parking_movements (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    entry_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    exit_at TIMESTAMP NULL,
    entry_notes VARCHAR(500) NULL,
    exit_notes VARCHAR(500) NULL,
    status movement_status_enum NOT NULL DEFAULT 'INSIDE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movement_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
    CONSTRAINT chk_movement_dates CHECK (exit_at IS NULL OR exit_at >= entry_at),
    CONSTRAINT chk_movement_status CHECK (
        (status = 'INSIDE' AND exit_at IS NULL) OR
        (status = 'CLOSED' AND exit_at IS NOT NULL)
    )
);

CREATE INDEX ix_movement_vehicle ON parking_movements (vehicle_id);
CREATE INDEX ix_movement_status_entry ON parking_movements (status, entry_at);