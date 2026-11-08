Plan de pruebas-Iteración 2:

Proyecto: Autos Colombia · Módulos: gestión de clientes y de celdas · Entorno: navegador, servidor local y MySQL · Responsable y fecha: 8/11/2026.

ID	HU / RF	Caso y datos de entrada	Resultado esperado	Obtenido	Estado
PP-01	HU-06 / RF-11	Registrar cliente con documento nuevo y datos válidos	Se crea ACTIVO y se muestra confirmación		Pendiente
PP-02	HU-06 / RF-12	Registrar cliente con un documento ya existente	Se rechaza con mensaje y no se duplica		Pendiente
PP-03	HU-06 / RF-12	Registrar cliente con el nombre vacío	Se rechaza y no se crea		Pendiente
PP-04	HU-07 / RF-13	Buscar por un documento existente	Aparece el cliente		Pendiente
PP-05	HU-07 / RF-13	Buscar un texto que no existe	Mensaje de que no hay resultados		Pendiente
PP-06	HU-08 / RF-14	Cambiar el teléfono de un cliente	El cambio queda guardado		Pendiente
PP-07	HU-08 / RF-14	Cambiar el documento por uno que ya existe	Se rechaza y no se guarda		Pendiente
PP-08	HU-09 / RF-15	Inactivar un cliente confirmando	Pasa a Inactivo y conserva sus vehículos		Pendiente
PP-09	HU-09 / RF-15	Reactivar un cliente inactivo	Vuelve a Activo		Pendiente
PP-10	HU-10 / RF-16	Asociar la placa “ abc123 “ a un cliente	Se guarda como ABC123 y aparece en su detalle		Pendiente
PP-11	HU-10 / RF-16	Asociar una placa que ya es de otro cliente	Se rechaza con mensaje		Pendiente
PP-12	HU-11 / RF-18	Crear celda con código nuevo y tipo	Se crea en estado LIBRE		Pendiente
PP-13	HU-11 / RF-18	Crear celda con código repetido	Se rechaza (409)		Pendiente
PP-14	HU-12 / RF-19	Abrir el mapa de celdas	Los contadores coinciden con los estados		Pendiente
PP-15	HU-12 / RF-19	Filtrar por estado Ocupada	Solo se muestran celdas ocupadas, con su placa		Pendiente
PP-16	HU-13 / RF-20	Editar el tipo de una celda	El cambio queda guardado		Pendiente
PP-17	HU-13 / RF-20	Reactivar una celda inactiva	Queda LIBRE		Pendiente
PP-18	HU-14 / RF-21	Inactivar una celda libre	Pasa a INACTIVA		Pendiente
PP-19	HU-14 / RF-21	Inactivar una celda ocupada	Se rechaza (409) y no cambia		Pendiente
PP-20	HU-15 / RF-22	Asignar una celda libre a un vehículo con entrada abierta	La celda pasa a OCUPADA y muestra la placa		Pendiente
PP-21	HU-15 / RF-24	Asignar una celda ocupada o inactiva	Se rechaza (409)		Pendiente
PP-22	HU-15 / RF-24	Asignar otra celda a un vehículo que ya tiene una	Se rechaza (409)		Pendiente
PP-23	HU-16 / RF-23	Liberar una celda ocupada confirmando	Pasa a LIBRE y deja de mostrar la placa		Pendiente
PP-24	HU-16 / RF-23	Liberar una celda que ya está libre