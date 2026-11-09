# Autos Colombia

Sistema web para administrar la operación de un parqueadero: movimientos de vehículos, clientes y celdas.

## Funcionalidades

- Registrar entradas y salidas de vehículos y consultar los que están dentro.
- Consultar el historial de movimientos por placa.
- Crear, consultar y actualizar clientes, y asociarles vehículos.
- Crear y editar celdas, consultar su estado y asignarlas o liberarlas.
- Filtrar celdas por tipo y estado.

## Tecnologías

- **Backend:** Node.js 20+ y Express
- **Base de datos:** PostgreSQL 15+
- **Frontend:** HTML, CSS y JavaScript con módulos ES
- **Administración de la base de datos:** pgAdmin (opcional)

## Requisitos

- Node.js 20 o superior
- PostgreSQL 15 o superior
- npm

## Instalación y configuración

1. Clona o descomprime el repositorio y abre una terminal en la carpeta del proyecto.
2. Crea una base de datos llamada `autos_colombia` en PostgreSQL.
3. En la raíz del proyecto, crea un archivo `.env` con tus credenciales locales:

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   DB_NAME=autos_colombia
   ```

4. Conéctate a la base de datos `autos_colombia` y ejecuta el script [`database/schema.sql`](database/schema.sql).
5. Instala las dependencias e inicia el servidor:

   ```bash
   npm install
   npm start
   ```

   Para desarrollo, puedes usar `npm run dev`.

6. Abre [http://localhost:3000](http://localhost:3000).

> Ejecuta `schema.sql` una sola vez en una base de datos nueva: el script crea tipos y tablas que ya no deben existir previamente.

## Módulos de la aplicación

| Página | Descripción |
|---|---|
| Parqueadero | Registrar entradas y salidas, consultar vehículos dentro y buscar historial |
| Clientes | Registrar y administrar clientes y sus vehículos asociados |
| Celdas | Crear y administrar celdas, filtrar por tipo/estado y asignarlas a vehículos |

## API REST

Todas las rutas están disponibles bajo `/api`.

### Sistema

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Verificar el estado del servicio |

### Vehículos y movimientos

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/vehicles/entry` | Registrar una entrada |
| `GET` | `/vehicles/inside` | Listar vehículos dentro del parqueadero |
| `POST` | `/vehicles/:id/exit` | Registrar la salida de un vehículo |
| `GET` | `/vehicles/history?plate=ABC123` | Consultar movimientos por placa |

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/clients?q=texto` | Listar o buscar clientes |
| `POST` | `/clients` | Crear un cliente |
| `GET` | `/clients/:id` | Consultar un cliente y sus vehículos |
| `PUT` | `/clients/:id` | Actualizar un cliente |
| `POST` | `/clients/:id/inactivate` | Inactivar un cliente |
| `POST` | `/clients/:id/reactivate` | Reactivar un cliente |
| `POST` | `/clients/:id/vehicles` | Asociar un vehículo a un cliente |

### Celdas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/cells` | Consultar celdas y resumen por estado; acepta filtros `type` y `status` |
| `POST` | `/cells` | Crear una celda |
| `PUT` | `/cells/:id` | Actualizar una celda |
| `POST` | `/cells/:id/inactivate` | Inactivar una celda |
| `POST` | `/cells/:id/reactivate` | Reactivar una celda |
| `POST` | `/cells/:id/assign` | Asignar un vehículo a una celda |
| `POST` | `/cells/:id/release` | Liberar una celda |

## Estructura del proyecto

```text
autos-colombia/
├── database/
│   ├── env.example
│   └── schema.sql
├── docs/
│   ├── historias-usuario.md
│   ├── pruebas.md
│   ├── requerimientos.md
│   └── requerimientos2.md
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── app.js
│   │   ├── celdas.js
│   │   └── clientes.js
│   ├── celdas.html
│   ├── clientes.html
│   └── index.html
├── src/
│   ├── config/
│   ├── middleware/
│   └── modules/
│       ├── cells/
│       ├── clients/
│       └── vehicles/
├── package.json
└── README.md
```

## Reglas principales

- Las placas se normalizan a mayúsculas y sin espacios.
- Un vehículo no puede tener más de una entrada abierta al mismo tiempo.
- Solo se registra una salida cuando el vehículo tiene una entrada abierta.
- El código de cada celda y la placa de cada vehículo deben ser únicos.
- Una celda ocupada debe tener un vehículo asignado; una celda libre o inactiva no.
- Las credenciales de la base de datos deben configurarse localmente en `.env`; no las publiques.

## Documentación

Consulta [`docs/requerimientos.md`](docs/requerimientos.md), [`docs/requerimientos2.md`](docs/requerimientos2.md), [`docs/historias-usuario.md`](docs/historias-usuario.md) y [`docs/pruebas.md`](docs/pruebas.md).
