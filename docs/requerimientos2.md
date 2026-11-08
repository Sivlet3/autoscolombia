1. Alcance de la Iteración 2

Gestionar los clientes que contratan la mensualidad (registro, consulta, edición, estado y vehículos asociados) y gestionar las celdas del parqueadero (creación, estado, edición, inactivación, asignación y liberación). La validación de mensualidad vigente sigue pendiente hasta la gestión de pagos.

2. Requerimientos funcionales
ID	Requerimiento	Prioridad	Criterio verificable
RF-11	El sistema permitirá registrar un cliente con tipo y número de documento, nombre completo, teléfono y correo (opcional).	Alta	Con datos válidos se crea el cliente en estado ACTIVO.
RF-12	El sistema validará los campos obligatorios y que el documento no esté repetido.	Alta	Un documento existente o un campo vacío se rechazan sin crear el registro.
RF-13	El sistema permitirá listar clientes y buscarlos por documento o nombre.	Alta	La búsqueda devuelve las coincidencias o un mensaje de que no hay resultados.
RF-14	El sistema permitirá editar los datos de un cliente existente.	Media	Los cambios válidos quedan guardados; el documento no se duplica.
RF-15	El sistema permitirá inactivar y reactivar un cliente sin eliminarlo.	Media	El cliente cambia de estado y conserva vehículos e historial.
RF-16	El sistema permitirá asociar uno o más vehículos (placa y tipo) a un cliente.	Alta	La placa se normaliza como en RF-02 y queda vinculada al cliente.
RF-17	El sistema permitirá consultar los vehículos asociados a un cliente.	Media	El detalle del cliente lista sus placas y tipos.
RF-18	El sistema permitirá crear una celda con código único y tipo.	Alta	La celda queda LIBRE; un código repetido se rechaza.
RF-19	El sistema mostrará las celdas con su estado, un resumen por estado y filtros por tipo y estado.	Alta	Se muestran contadores de libres, ocupadas e inactivas y los filtros funcionan.
RF-20	El sistema permitirá editar el código y tipo de una celda y reactivar una celda inactiva.	Media	Los cambios válidos se guardan y el código sigue siendo único.
RF-21	El sistema permitirá inactivar una celda que no esté ocupada.	Media	Una celda ocupada no se inactiva y la API responde conflicto.
RF-22	El sistema permitirá asignar una celda libre y activa a un vehículo.	Alta	La celda pasa a OCUPADA y muestra la placa asignada.
RF-23	El sistema permitirá liberar una celda ocupada.	Alta	La celda vuelve a LIBRE y deja de mostrar la placa.
RF-24	El sistema impedirá asignar una celda ocupada o inactiva, o asignar dos celdas al mismo vehículo.	Alta	La API responde conflicto y no modifica datos.
3. Requerimientos no funcionales
ID	Requerimiento	Métrica / verificación
RNF-11	Integridad	Claves foráneas entre cliente, vehículo y celda; restricciones únicas para documento, placa y código de celda.
RNF-12	Consistencia	La asignación y liberación de celdas se ejecutan en transacción para evitar dos asignaciones simultáneas.
RNF-13	Usabilidad	El estado de la celda se distingue por color y por texto, no solo por color; formularios con etiquetas visibles.
RNF-14	Rendimiento	La consulta de celdas y clientes responde en menos de 2 segundos con hasta 200 celdas y 500 clientes.
RNF-15	Privacidad	Solo se piden datos personales mínimos y no se muestran en mensajes de error; se tiene en cuenta la Ley 1581 de 2012 de protección de datos.
RNF-16	Seguridad	Consultas parametrizadas y validación en el servidor, además de la del formulario.
RNF-17	Mantenibilidad y compatibilidad	Se mantiene la separación en rutas, controlador, servicio y repositorio; interfaz adaptable a escritorio y móvil.
4. Reglas de negocio
RN-07: Un cliente se identifica por tipo y número de documento únicos.
RN-08: Un cliente puede tener varios vehículos; una placa pertenece a un solo cliente.
RN-09: Un cliente no se elimina, solo se inactiva, y conserva sus vehículos e historial.
RN-10: El código de una celda es único.
RN-11: Una celda está en uno de tres estados: LIBRE, OCUPADA o INACTIVA. Una celda con vehículo asignado está OCUPADA.
RN-12: Solo se asignan celdas LIBRES; una celda INACTIVA no se asigna.
RN-13: No se puede inactivar una celda OCUPADA.
RN-14: Una celda tiene como máximo un vehículo y un vehículo ocupa como máximo una celda.
RN-15: El tipo de la celda debe corresponder al tipo del vehículo.
RN-16: El Operador consulta; el Administrador crea, edita, inactiva, asigna y libera (como en el diagrama de casos de uso).
RN-17: La asignación requiere que el vehículo tenga un movimiento INSIDE abierto.
5. Casos de uso de clientes (pendientes en StarUML)

Continúan la numeración de celdas (CU-14 a CU-19):

CU	Nombre	Actor	Relación
CU-20	Registrar cliente	Administrador	«include» Validar documento único
CU-21	Consultar y buscar clientes	Operador	
CU-22	Editar cliente	Administrador	
CU-23	Inactivar / reactivar cliente	Administrador	
CU-24	Asociar vehículo a cliente	Administrador	«include» Validar placa única

Mantén que el Administrador hereda del Operador, como en tu diagrama de celdas.

6. Historias de usuario

HU-06 Registrar cliente. Como administrador, quiero registrar un cliente con su documento y datos de contacto, para identificar a quien paga la mensualidad.

Con datos válidos, el sistema crea el cliente y muestra confirmación.
Con un documento ya registrado, rechaza la operación e informa el error.
Con campos obligatorios vacíos, no crea el cliente.

HU-07 Consultar y buscar clientes. Como operador, quiero ver y buscar clientes por documento o nombre, para encontrarlos rápido.

Al abrir la pantalla se muestra la lista de clientes.
La búsqueda filtra por documento o nombre.
Si no hay resultados, se muestra un mensaje claro.

HU-08 Editar cliente. Como administrador, quiero corregir los datos de un cliente, para mantener la información actualizada.

Los cambios válidos se guardan y se confirman.
No permite dejar un documento repetido.
Los campos obligatorios no pueden quedar vacíos.

HU-09 Inactivar y reactivar cliente. Como administrador, quiero inactivar o reactivar un cliente, para reflejar si sigue con el servicio sin perder su historial.

Antes de cambiar el estado, la interfaz pide confirmación.
El cliente inactivo conserva sus vehículos e historial.
El cliente reactivado vuelve a estado ACTIVO.

HU-10 Asociar vehículo a cliente. Como administrador, quiero asociar uno o más vehículos a un cliente, para saber a quién pertenece cada placa.

La placa se normaliza (mayúsculas, sin espacios) y se vincula al cliente.
Una placa ya asociada a otro cliente se rechaza.
El detalle del cliente lista sus vehículos.

HU-11 Crear celda. Como administrador, quiero crear una celda con código y tipo, para ampliar la capacidad del parqueadero.

Con datos válidos, la celda se crea en estado LIBRE.
Un código repetido se rechaza.
El código y el tipo son obligatorios.

HU-12 Consultar estado de celdas. Como operador, quiero ver el estado de todas las celdas, para saber cuáles están disponibles.

Se muestra el resumen de libres, ocupadas e inactivas.
Cada celda ocupada muestra la placa asignada.
Se puede filtrar por tipo y por estado.

HU-13 Editar celda. Como administrador, quiero modificar una celda o reactivarla, para corregir sus datos o volver a usarla.

Los cambios válidos se guardan y se confirman.
El código editado sigue siendo único.
Una celda inactiva puede reactivarse y queda LIBRE.

HU-14 Inactivar celda. Como administrador, quiero inactivar una celda, para sacarla de servicio por mantenimiento o daño.

Solo se inactiva una celda que no esté ocupada.
Antes de inactivar, la interfaz pide confirmación.
La celda inactiva no se puede asignar.

HU-15 Asignar celda a vehículo. Como administrador, quiero asignar una celda libre a un vehículo, para que cada vehículo tenga su espacio.

Solo se asignan celdas LIBRES y activas.
Al asignar, la celda pasa a OCUPADA y muestra la placa.
Un vehículo que ya tiene celda no puede recibir otra.

HU-16 Liberar celda. Como administrador, quiero liberar una celda ocupada, para que quede disponible de nuevo.

Solo se libera una celda OCUPADA.
Al liberar, la celda pasa a LIBRE y deja de mostrar la placa.
La interfaz pide confirmación antes de liberar.

Trazabilidad

Historia	Caso de uso	RF relacionados	Pantalla
HU-06	CU-20	RF-11, RF-12	Registro de cliente
HU-07	CU-21	RF-13	Listado de clientes
HU-08	CU-22	RF-14	Edición de cliente
HU-09	CU-23	RF-15	Listado de clientes
HU-10	CU-24	RF-16, RF-17	Detalle de cliente
HU-11	CU-14	RF-18	Mapa de celdas
HU-12	CU-15	RF-19	Mapa de celdas
HU-13	CU-16	RF-20	Mapa de celdas
HU-14	CU-17	RF-21	Mapa de celdas
HU-15	CU-18	RF-22, RF-24	Mapa de celdas
HU-16	CU-19	RF-23	Mapa de celdas
Para que todo cuadre
Estados en el mockup: con RN-11, A-01 (ABC123) y B-02 (RTY789) deben ir en azul. Los contadores quedarían en Libres: 34, Ocupadas: 5, Inactivas: 1.
Acciones de celdas: el mockup debe mostrar dónde se editan, inactivan, asignan y liberan las celdas (por ejemplo, un menú o panel al hacer clic en una celda).
Mockups de clientes: faltan tres pantallas: registro, listado con búsqueda y detalle con vehículos.
Supuestos: RN-15, RN-16 y RN-17 son decisiones mías. Revísalas contra lo que hace tu código y ajústalas si difieren. Además, la Iteración 1 dejó “usuarios y roles” fuera de alcance, así que RN-16 describe los perfiles del diagrama, no un inicio de sesión.