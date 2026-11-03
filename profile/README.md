# Sheily-AI

## Panel para miembros

[**Abrir panel interno: actividad, estadísticas, seguridad y documentación**](https://github.com/Sheily-AI/.github-private) · [Proyecto de organización](https://github.com/orgs/Sheily-AI/projects/1)

El panel interno requiere iniciar sesión con una cuenta con acceso. Las estadísticas y ejecuciones se consultan en las vistas de GitHub de cada repositorio.

**Inteligencia local · continuidad · evidencia · adaptación gobernada**

Sheily-AI reúne tres proyectos de inteligencia artificial con responsabilidades distintas: **SHEILY-COGNITIVA** organiza la interacción y las capacidades, **KV-SHEI** desarrolla inferencia y memoria K/V, e **INICIO** estudia y gobierna la adaptación. Dos repositorios adicionales mantienen dependencias concretas de KV-SHEI. Esta portada es un mapa para entender el conjunto; cada sistema conserva su propia autoridad y su propio estado operativo.

## Qué buscamos

Queremos que una capacidad no se defina solo por estar escrita en el código. Importan el contrato que la describe, quién puede ejecutarla, qué efecto produce, qué estado conserva y qué evidencia permite comprobarla. Por eso distinguimos arquitectura, pruebas, artefactos, servicios activos y resultados reales. También distinguimos la memoria cognitiva de SHEILY del estado físico K/V de un modelo: son problemas relacionados, pero no la misma cosa.

## Los tres sistemas

### [SHEILY-COGNITIVA](https://github.com/Sheily-AI/SHEILY-COGNITIVA) — interacción, capacidades y memoria cognitiva

SHEILY es el producto cognitivo modular. Su núcleo en Rust recibe solicitudes, valida identidad y autoridad, coordina un turno, selecciona capacidades y gobierna sus efectos. La inferencia, el motor de memoria y la obtención de evidencia externa mediante GLOBUS tienen propietarios y contratos separados. El resultado debe poder expresar éxito, bloqueo, progreso parcial o evidencia insuficiente sin fingir que una acción terminó.

Su arquitectura diferencia el plano público del administrativo y del de agentes; la memoria trata lectura, escritura, consolidación y ciclo de vida con sus controles de acceso. La interfaz y las herramientas auxiliares acompañan al núcleo, pero su presencia no convierte una ruta en un servicio desplegado.

**Para orientarse:** [documentación](https://github.com/Sheily-AI/SHEILY-COGNITIVA/tree/main/docs), [mapa de autoridad](https://github.com/Sheily-AI/SHEILY-COGNITIVA/blob/main/docs/PRODUCTION_MAP.md) y [estado observado](https://github.com/Sheily-AI/SHEILY-COGNITIVA/blob/main/docs/STATUS.md).

### [KV-SHEI / M-SLIM](https://github.com/Sheily-AI/KV-SHEI) — inferencia y continuidad física del contexto

KV-SHEI es un proyecto distinto de SHEILY. Su runtime M-SLIM, escrito en Rust, ejecuta modelos de lenguaje mediante adaptadores y gestiona el estado de atención K/V. La arquitectura contempla ejecución CPU y acelerada, sesiones, almacenamiento persistente, restauración, recuperación documental y validación ligada a una configuración concreta.

ColdStore conserva K/V canónico; índices, regiones y micrometadatos sirven para organizar, localizar o certificar decisiones, no para reemplazar por sí solos el contenido físico original. El sistema separa también la continuidad de una sesión de la mera repetición de texto visible. Matrices, calibraciones y recibos buscan delimitar qué ruta se probó, con qué modelo, código y entorno. Una prueba de integridad no demuestra automáticamente mayor velocidad ni autoriza otro hardware.

**Para orientarse:** [arquitectura y flujos](https://github.com/Sheily-AI/KV-SHEI/blob/main/docs/ARCHITECTURE_FLOWS.md), [catálogo de capacidades](https://github.com/Sheily-AI/KV-SHEI/blob/main/docs/CAPABILITY_CATALOG.md), [continuidad](https://github.com/Sheily-AI/KV-SHEI/blob/main/docs/CONTINUITY_LIFECYCLE.md) y [validación](https://github.com/Sheily-AI/KV-SHEI/blob/main/docs/VALIDATION.md).

### [INICIO](https://github.com/Sheily-AI/INICIO) — observación y adaptación con admisión

INICIO es un runtime adaptativo independiente en Python. Observa dinámicas, evalúa propuestas de aprendizaje y cambios estructurales, y decide bajo reglas de admisión si una actualización acotada puede avanzar, debe permanecer en evaluación o debe bloquearse. La evaluación en sombra, el canary, la persistencia de evidencia y las rutas de revocación o rollback forman parte de ese gobierno.

INICIO no es el servidor de chat de SHEILY ni reentrena automáticamente su modelo de lenguaje. Una recomendación, una propuesta o una prueba aislada no equivalen a una promoción efectiva.

**Para orientarse:** [arquitectura](https://github.com/Sheily-AI/INICIO/blob/main/docs/ARCHITECTURE.md), [operación](https://github.com/Sheily-AI/INICIO/blob/main/docs/OPERATIONS.md) y [estado observado](https://github.com/Sheily-AI/INICIO/blob/main/docs/STATUS.md).

## Cómo se relacionan

SHEILY-COGNITIVA mantiene la autoridad sobre su API y los efectos de las solicitudes. Puede enviar observaciones medidas a INICIO mediante un puente gobernado **cuando está configurado y habilitado**; eso no delega el turno público ni concede una promoción automática. KV-SHEI mantiene su propio runtime y sus propios contratos de K/V: pertenecer a esta organización no demuestra que esté integrado en una instalación concreta de SHEILY. Las relaciones reales se comprueban en la configuración y la ejecución de cada versión.

## Dependencias mantenidas para KV-SHEI

- [KV-SHEI-tch-rs](https://github.com/Sheily-AI/KV-SHEI-tch-rs): fork de mantenimiento de tch/torch-sys para el backend LibTorch.
- [KV-SHEI-tokenizador-rust](https://github.com/Sheily-AI/KV-SHEI-tokenizador-rust): fork de mantenimiento de tokenizers.

Son dependencias, no otros productos de la organización. Sus revisiones y licencias se gobiernan en los repositorios correspondientes.

## Cómo interpretar el estado de una capacidad

Una declaración de código, un test aprobado, un binario compilado, una release instalada y un servicio que responde son hechos diferentes. Para afirmar funcionamiento en una ruta concreta se necesita enlazar la versión fuente con la configuración efectiva, el artefacto, la petición real, el efecto y, cuando aplique, la persistencia y recuperación. Los documentos de estado son observaciones fechadas; no son indicadores en tiempo real. La portada no sustituye esas comprobaciones ni promete que todas las rutas estén activas en todos los entornos.

## Acceso y seguimiento

Los repositorios de sistemas y dependencias son **privados actualmente**. Aquí se muestran sus nombres y funciones, pero sus enlaces a código, documentación, issues y pull requests requieren permiso. El repositorio público [.github](https://github.com/Sheily-AI/.github) alberga únicamente esta presentación. Cada proyecto mantiene sus propias condiciones de uso, seguridad y contribución; no existe una licencia o un estado de producción único para toda la organización.
