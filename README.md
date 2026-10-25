# Autos Colombia — Iteración 1
Sistema modular para registrar entradas y salidas de vehículos en un parqueadero por mensualidad Ac1 

## 1. Alcance
Esta entrega implementa un MVP académico de la **Iteración 1: Gestión de entrada y salida de vehículos**. Incluye:
- Registro de entrada de un vehículo.
- Consulta de vehículos actualmente dentro.
- Registro de salida y cálculo de tiempo transcurrido.
- Búsqueda de movimientos por placa.
- API REST modular y una interfaz web sencilla.
- Esquema físico MySQL, MER/MR documentados y fuentes de diagramas para recrearlos en StarUML.
- Historias de usuario, requerimientos y criterios de aceptación.

> Esta versión no implementa todavía el módulo completo de usuarios, celdas, novedades ni pagos; se dejan identificados como iteraciones posteriores. La interfaz usa una API local y datos persistidos en MySQL.

## 2. Tecnologías
- Node.js 20+
- Express
- MySQL 8+
- HTML, CSS y JavaScript modular en navegador
- StarUML para diagramas UML; Figma para mockups

## 3. Requisitos previos
Instala Node.js 20+ y MySQL 8+. Crea la base de datos con el script incluido.

## 4. Configuración
1. Descomprime el proyecto.
2. Abre una terminal en la carpeta autos-colombia.
3. Copia .env.example a .env y configura las credenciales de MySQL.
4. En MySQL ejecuta el contenido de database/schema.sql.
5. Instala dependencias y ejecuta el servidor:

bash
npm install
npm run dev


6. Abre http://localhost:3000.

## 5. API
| Método | Ruta | Descripción |
|---|---|---|
| GET | /api/health | Estado del servicio |
| POST | /api/vehicles/entry | Registrar entrada |
| GET | /api/vehicles/inside | Listar vehículos dentro |
| POST | /api/vehicles/:id/exit | Registrar salida |
| GET | /api/vehicles/history?plate=ABC123 | Consultar historial por placa |

Ejemplo de entrada:
json
{
  "plate": "ABC123",
  "vehicleType": "AUTOMOVIL",
  "ownerName": "María Pérez",
  "notes": "Sin novedades visibles"
}


## 6. Estructura del proyecto
text
autos-colombia/
├── database/
│   └── schema.sql
├── docs/
│   ├── requerimientos.md
│   ├── historias-usuario.md
│   ├── modelos-datos.md
│   ├── arquitectura.md
│   ├── mockups-figma.md
│   └── diagrams/
│       ├── casos-uso.puml
│       ├── clases.puml
│       └── paquetes.puml
├── public/
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── api.js
│       └── app.js
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/database.js
│   ├── modules/vehicles/
│   │   ├── vehicle.controller.js
│   │   ├── vehicle.routes.js
│   │   ├── vehicle.service.js
│   │   └── vehicle.repository.js
│   └── middleware/error-handler.js
├── .env.example
└── package.json


## 7. Decisiones y reglas de negocio
- La placa se normaliza a mayúsculas y se eliminan espacios.
- Un vehículo no puede tener dos entradas abiertas simultáneamente.
- La salida solo se registra si existe una entrada abierta.
- entry_at y exit_at se almacenan como fecha/hora.
- Los datos de conexión se leen desde variables de entorno; no se guardan contraseñas en Git.
- Los endpoints validan datos básicos y devuelven códigos HTTP apropiados.

## 8. Pruebas manuales rápidas
1. Registra una entrada con placa ABC123.
2. Comprueba que aparezca en “Vehículos dentro”.
3. Registra su salida.
4. Confirma que ya no aparece como vehículo dentro.
5. Consulta el historial por placa.

## 9. GitHub
Desde la carpeta del proyecto:
bash
git init
git add .
git commit -m "Entrega inicial Autos Colombia Iteracion 1"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/autos-colombia.git
git push -u origin main

Crea previamente un repositorio vacío en GitHub y reemplaza TU_USUARIO por tu usuario. No compartas el archivo .env.

## 10. StarUML y Figma
- Los archivos .puml de docs/diagrams/ son una especificación de referencia para recrear los diagramas en StarUML. PlantUML no es un archivo nativo de StarUML.
- docs/mockups-figma.md describe las pantallas, componentes y flujos que debes construir en Figma. La web incluida sirve como prototipo funcional inicial, no como archivo .fig.
- Antes de entregar, captura los diagramas y mockups finales desde las herramientas solicitadas e inclúyelos en el informe.

## 11. Limitaciones del MVP
No hay autenticación ni roles, gestión de celdas, registro formal de clientes, novedades estructuradas, facturación ni pagos. Añádelos como iteraciones siguientes. Para un entorno real se requieren controles de acceso, auditoría, copias de seguridad, pruebas automatizadas y revisión de seguridad.
