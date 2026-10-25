# Historias de usuario — Iteración 1

## HU-01 Registrar entrada
**Como** operador del parqueadero, **quiero** registrar la entrada de un vehículo con su placa, tipo y responsable, **para** mantener el control de los vehículos que ingresan.

**Prioridad:** Alta. **Requerimientos relacionados:** RF-01, RF-02, RF-08, RF-10.

Criterios de aceptación:
1. Dado que los campos obligatorios son válidos, cuando envío el formulario, entonces el sistema registra la entrada y muestra confirmación.
2. Dada una placa con espacios o minúsculas, cuando registro la entrada, entonces se normaliza.
3. Dada una placa inválida o un responsable vacío, cuando envío, entonces se informa el error y no se crea el movimiento.
4. Dado que la placa ya tiene una entrada abierta, cuando intento ingresar de nuevo, entonces el sistema rechaza la operación.

## HU-02 Consultar vehículos dentro
**Como** operador, **quiero** ver los vehículos que permanecen dentro, **para** saber cuáles movimientos están abiertos.

Criterios de aceptación:
1. Al abrir la pantalla, se consulta la lista actual.
2. Cada fila muestra placa, tipo, responsable y fecha/hora de entrada.
3. Si no hay vehículos dentro, se muestra un mensaje vacío.
4. El operador puede actualizar la lista manualmente.

## HU-03 Registrar salida
**Como** operador, **quiero** registrar la salida de un vehículo, **para** cerrar el movimiento y conservar la hora de salida.

Criterios de aceptación:
1. Solo se puede cerrar un movimiento abierto.
2. Antes de registrar, la interfaz solicita confirmación.
3. Al completar la salida, el movimiento deja de aparecer en la lista de vehículos dentro.
4. La respuesta informa una duración aproximada en minutos.

## HU-04 Consultar historial por placa
**Como** operador, **quiero** consultar los movimientos de una placa, **para** verificar sus entradas y salidas anteriores.

Criterios de aceptación:
1. Se exige una placa para buscar.
2. Los resultados se ordenan del más reciente al más antiguo.
3. Si no hay resultados, se informa claramente.
4. Se muestran fechas, estado y observación de entrada.

## HU-05 Registrar novedades básicas
**Como** operador, **quiero** escribir observaciones al registrar una entrada o salida, **para** dejar constancia de condiciones visibles del vehículo.

Criterios de aceptación:
1. Las observaciones son opcionales.
2. Se almacenan en el movimiento correcto.
3. No se permiten más de 500 caracteres.

## Trazabilidad
| Historia | RF relacionados | Pantalla |
|---|---|---|
| HU-01 | RF-01, RF-02, RF-08, RF-10 | Registro de entrada |
| HU-02 | RF-04 | Vehículos dentro |
| HU-03 | RF-05, RF-06, RF-09 | Lista de vehículos dentro |
| HU-04 | RF-07, RF-10 | Historial por placa |
| HU-05 | RF-08 | Registro de entrada / salida |
