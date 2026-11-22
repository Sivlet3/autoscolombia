# Autos Colombia
# Autos Colombia

Sistema web para administrar la operación de un parqueadero por mensualidad: movimientos de vehículos, clientes, celdas y pagos.

## Funcionalidades

- Registrar entradas y salidas de vehículos y consultar los que están dentro.
- Consultar el historial de movimientos por placa.
- Crear, consultar y actualizar clientes, y asociarles vehículos.
- Crear y editar celdas, consultar su estado y asignarlas o liberarlas.
- Filtrar celdas por tipo y estado.
- **Cobrar la mensualidad por pasarela de pago (Wompi) o en efectivo.**
- **Recibir la confirmación firmada de la pasarela y activar la mensualidad automáticamente.**
- **Consultar el historial de pagos, imprimir comprobantes y anular pagos pendientes.**
- **Consultar el estado de las mensualidades (vigente, por vencer, vencida) y recibir una alerta al registrar la entrada de un vehículo sin mensualidad vigente.**

## Tecnologías

- **Backend:** Node.js 20+ y Express
- **Base de datos:** PostgreSQL 15+
- **Frontend:** HTML, CSS y JavaScript con módulos ES
- **Pasarela de pago:** Wompi (o una pasarela de práctica local)
- **Administración de la base de datos:** pgAdmin (opcional)

## Requisitos

- Node.js 20 o superior
- PostgreSQL 15 o superior
- npm

## Instalación y configuración

1. Clona o descomprime el repositorio y abre una terminal en la carpeta del proyecto.
2. Crea una base de datos llamada `autos_colombia` en PostgreSQL.
3. En la raíz del proyecto, crea un archivo `.env` con tus credenciales locales (puedes partir de [`.env.example`](.env.example)):

   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=tu_contraseña
   DB_NAME=autos_colombia

   # Pasarela de pago: simulator (práctica, no cobra) o wompi
   PAYMENT_GATEWAY=simulator
   APP_BASE_URL=http://localhost:3000
   ```

4. Conéctate a la base de datos `autos_colombia` y ejecuta, en este orden:
   1. [`database/schema.sql`](database/schema.sql)
   2. [`database/iteration3.sql`](database/iteration3.sql) (pagos, mensualidades y tarifas)
5. Instala las dependencias e inicia el servidor:

   ```bash
   npm install
   npm start
   ```

   Para desarrollo, puedes usar `npm run dev`.

6. Abre [http://localhost:3000](http://localhost:3000).

> Ejecuta cada script SQL una sola vez: crean tipos y tablas que no deben existir previamente. Si tu base de datos ya tenía `schema.sql`, ejecuta solo `iteration3.sql`.

## Pruebas automáticas

```bash
npm test
```

Verifican la firma de los pagos y de los eventos de la pasarela con los ejemplos de la documentación de Wompi.

## Pasarela de pago

El sistema cobra la mensualidad de un vehículo asociado a un cliente activo. El valor lo define el servidor según la tarifa del tipo de vehículo (tabla `monthly_rates`, en pesos colombianos). Los datos de tarjeta nunca pasan por el sistema.

| `PAYMENT_GATEWAY` | Uso |
|---|---|
| `simulator` | Pasarela de práctica incluida (`/pasarela-simulada.html`): no cobra dinero y reproduce el formato y la firma de los eventos de Wompi. Sirve para desarrollar y probar. |
| `wompi` | Wompi en modo pruebas (`sandbox`) o producción. |

### Configurar Wompi

1. Crea una cuenta en Wompi y obtén las llaves de pruebas en la sección de desarrolladores.
2. Agrega al `.env` (nunca las subas a Git):

   ```env
   PAYMENT_GATEWAY=wompi
   WOMPI_ENV=sandbox
   WOMPI_PUBLIC_KEY=pub_test_xxxxxxxx
   WOMPI_PRIVATE_KEY=prv_test_xxxxxxxx
   WOMPI_INTEGRITY_SECRET=test_integrity_xxxxxxxx
   WOMPI_EVENTS_SECRET=test_events_xxxxxxxx
   APP_BASE_URL=https://tu-dominio-publico
   ```

3. En el panel de Wompi, configura la URL de eventos como `https://tu-dominio-publico/api/payments/webhook`. Para probar desde tu computador necesitas una URL pública (por ejemplo, con un túnel).
4. Para producción cambia `WOMPI_ENV=production` y usa las llaves de producción.

### Flujo de un pago

1. En **Pagos** se consulta la placa y se elige *Pasarela* o *Efectivo*.
2. Con la pasarela se crea un pago `PENDIENTE` y el cliente continúa en el checkout.
3. La pasarela notifica el resultado con un evento firmado; el sistema verifica la firma, compara el valor y actualiza el pago.
4. Si queda `APROBADO`, se activa o extiende la mensualidad un mes.

## Módulos de la aplicación

| Página | Descripción |
|---|---|
| Parqueadero (`/`) | Registrar entradas y salidas, consultar vehículos dentro y buscar historial; avisa si el vehículo no tiene mensualidad vigente |
| Clientes (`/clientes.html`) | Registrar y administrar clientes y sus vehículos asociados |
| Celdas (`/celdas.html`) | Crear y administrar celdas, filtrar por tipo/estado y asignarlas a vehículos |
| Pagos (`/pagos.html`) | Cobrar mensualidades, ver el historial, actualizar o anular pagos pendientes |
| Mensualidades (`/mensualidades.html`) | Consultar el estado de la mensualidad por placa o por estado |
| Resultado del pago (`/pago-resultado.html`) | Pantalla a la que vuelve el cliente desde la pasarela |
| Comprobante (`/comprobante.html?id=`) | Detalle imprimible de un pago |

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

### Pagos y mensualidades

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/payments/config` | Pasarela activa |
| `GET` | `/payments/rates` | Tarifas mensuales por tipo de vehículo |
| `POST` | `/payments` | Crear un pago (`plate` y `method`: `PASARELA` o `EFECTIVO`) |
| `GET` | `/payments?q=texto&status=APROBADO` | Listar pagos con búsqueda y filtro por estado |
| `GET` | `/payments/:id` | Consultar un pago y su bitácora (comprobante) |
| `GET` | `/payments/by-reference/:reference` | Consultar un pago por su referencia (resultado al volver de la pasarela) |
| `POST` | `/payments/:id/sync` | Actualizar el estado de un pago pendiente con la pasarela |
| `POST` | `/payments/:id/cancel` | Anular un pago pendiente |
| `POST` | `/payments/webhook` | Recibir los eventos firmados de la pasarela |
| `POST` | `/payments/simulator/:reference/:outcome` | Solo con la pasarela de práctica (`approved`, `declined`, `error`) |
| `GET` | `/payments/memberships/status?plate=ABC123` | Estado de la mensualidad de una placa |
| `GET` | `/payments/memberships?status=VENCIDA` | Listar mensualidades por estado |

## Estructura del proyecto

```text
autos-colombia/
├── database/
│   ├── env.example
│   ├── schema.sql
│   └── iteration3.sql
├── docs/
│   ├── historias-usuario.md
│   ├── pruebas.md
│   ├── requerimientos.md
│   └── requerimientos2.md
├── public/
│   ├── css/
│   │   ├── styles.css
│   │   └── pagos.css
│   ├── js/
│   │   ├── api.js
│   │   ├── ui.js
│   │   ├── app.js
│   │   ├── celdas.js
│   │   ├── clientes.js
│   │   ├── pagos.js
│   │   ├── mensualidades.js
│   │   ├── pago-resultado.js
│   │   ├── pasarela-simulada.js
│   │   └── comprobante.js
│   ├── celdas.html
│   ├── clientes.html
│   ├── comprobante.html
│   ├── index.html
│   ├── mensualidades.html
│   ├── pago-resultado.html
│   ├── pagos.html
│   └── pasarela-simulada.html
├── src/
│   ├── config/
│   ├── middleware/
│   └── modules/
│       ├── cells/
│       ├── clients/
│       ├── payments/
│       │   └── gateways/   (Wompi y pasarela de práctica)
│       └── vehicles/
├── tests/
├── .env.example
├── package.json
└── README.md
```

## Reglas principales

- Las placas se normalizan a mayúsculas y sin espacios.
- Un vehículo no puede tener más de una entrada abierta al mismo tiempo.
- Solo se registra una salida cuando el vehículo tiene una entrada abierta.
- El código de cada celda y la placa de cada vehículo deben ser únicos.
- Una celda ocupada debe tener un vehículo asignado; una celda libre o inactiva no.
- Solo se cobra a vehículos asociados a un cliente activo; el valor lo define el servidor según la tarifa.
- Un vehículo no puede tener dos pagos pendientes a la vez, y la referencia de cada pago es única.
- Un pago aprobado extiende la mensualidad un mes; si ya hay una vigente, el nuevo mes empieza al vencer la anterior.
- Las confirmaciones de la pasarela solo se aceptan con firma válida y no se aplican dos veces.
- La falta de mensualidad vigente no impide registrar una entrada: solo genera una alerta.
- Las credenciales de la base de datos y las llaves de la pasarela deben configurarse localmente en `.env`; no las publiques.

## Documentación

Consulta [`docs/requerimientos.md`](docs/requerimientos.md), [`docs/requerimientos2.md`](docs/requerimientos2.md), [`docs/historias-usuario.md`](docs/historias-usuario.md) y [`docs/pruebas.md`](docs/pruebas.md).