# Requerimientos — Iteración 1

## 1. Alcance
Gestionar el ciclo de entrada y salida de vehículos. Se asume que el parqueadero opera por mensualidad, pero la validación de mensualidades y pagos queda fuera de esta iteración.

## 2. Requerimientos funcionales
| ID | Requerimiento | Prioridad | Criterio verificable |
|---|---|---|---|
| RF-01 | El sistema permitirá registrar una entrada indicando placa, tipo de vehículo y responsable. | Alta | Al enviar datos válidos se crea un movimiento abierto. |
| RF-02 | El sistema validará que la placa tenga entre 5 y 10 caracteres y la normalizará a mayúsculas sin espacios. | Alta |  abc123  se guarda como ABC123; placas fuera de longitud son rechazadas. |
| RF-03 | El sistema impedirá registrar una segunda entrada mientras el vehículo tenga un movimiento abierto. | Alta | La API responde conflicto y no crea otro movimiento abierto. |
| RF-04 | El sistema mostrará la lista de vehículos actualmente dentro del parqueadero. | Alta | La lista muestra placa, tipo, responsable y fecha/hora de entrada. |
| RF-05 | El sistema permitirá registrar la salida de un vehículo con entrada abierta. | Alta | El movimiento se cierra con fecha/hora de salida y estado CLOSED. |
| RF-06 | El sistema impedirá cerrar un movimiento inexistente o ya cerrado. | Alta | La API responde error sin modificar datos. |
| RF-07 | El sistema permitirá consultar los movimientos históricos usando la placa. | Media | Devuelve hasta 100 movimientos ordenados del más reciente al más antiguo. |
| RF-08 | El sistema permitirá registrar observaciones de entrada y salida. | Media | Las observaciones se guardan asociadas al movimiento correspondiente. |
| RF-09 | El sistema calculará una duración aproximada al registrar la salida. | Media | La respuesta incluye duración en minutos. |
| RF-10 | El sistema informará errores de validación y de operación al usuario. | Alta | Se presenta un mensaje comprensible sin exponer trazas técnicas. |

## 3. Requerimientos no funcionales
| ID | Requerimiento | Métrica / verificación |
|---|---|---|
| RNF-01 | Usabilidad | La entrada se registra en una pantalla y con un flujo breve; formularios con etiquetas visibles. |
| RNF-02 | Rendimiento | En entorno local de prueba, las consultas comunes deberían responder en menos de 2 segundos con hasta 100 movimientos activos. |
| RNF-03 | Integridad | Las claves foráneas, restricciones y transacciones mantienen consistencia entre vehículos y movimientos. |
| RNF-04 | Seguridad | Consultas parametrizadas; credenciales fuera del código y excluidas de Git. |
| RNF-05 | Mantenibilidad | Separación en rutas, controlador, servicio y repositorio. |
| RNF-06 | Disponibilidad / diagnóstico | Endpoint /api/health permite verificar que el servicio responde. |
| RNF-07 | Compatibilidad | Interfaz adaptable a escritorio y móvil en navegadores modernos. |
| RNF-08 | Privacidad | Solo se solicitan datos mínimos para identificar al responsable del vehículo en esta iteración. |
| RNF-09 | Fiabilidad | Errores HTTP coherentes: 400 validación, 404 recurso no encontrado, 409 conflicto y 500 error inesperado. |
| RNF-10 | Recuperación | La base de datos debe incluirse en una política de copias de seguridad cuando se despliegue. |

## 4. Reglas de negocio
- RN-01: Un vehículo se identifica por una placa única.
- RN-02: Una placa no puede tener más de un movimiento INSIDE simultáneo.
- RN-03: Una salida no puede ser anterior a la entrada.
- RN-04: Un movimiento INSIDE no tiene fecha de salida; un movimiento CLOSED sí la tiene.
- RN-05: Las observaciones son opcionales y tienen máximo 500 caracteres.
- RN-06: Registrar una entrada no equivale a confirmar que el vehículo tiene mensualidad vigente; esa validación se agrega en una iteración posterior.

## 5. Fuera de alcance
Gestión de celdas, administración de usuarios y roles, novedades como módulo independiente, pagos, alertas de mensualidad, reportes financieros y despliegue productivo.
