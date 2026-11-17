# Sheily-AI · guía de la organización

Esta carpeta de GitHub mantiene la [portada pública de la organización](profile/README.md) y un índice de sus componentes. No es un panel en tiempo real.

## Áreas de trabajo

| Área | Repositorios | Alcance |
| --- | --- | --- |
| Cognición | [SHEILY-COGNITIVA](https://github.com/Sheily-AI/SHEILY-COGNITIVA) | Solicitudes, turnos, capacidades, memoria, permisos y gobernanza |
| Adaptación y aprendizaje | [INICIO](https://github.com/Sheily-AI/INICIO), [TIDEX](https://github.com/Sheily-AI/TIDEX) | Observación, evaluación y promoción gobernada |
| Evidencia externa | [GLOBUS](https://github.com/Sheily-AI/GLOBUS) | Recuperación y conciliación factual |
| Memoria | [SHEILY-LIFELONG-MEMORY](https://github.com/Sheily-AI/SHEILY-LIFELONG-MEMORY) | Consolidación y candidatos de entrenamiento |
| Integración y despliegue | [SHEILY-INICIO-CONNECTOR](https://github.com/Sheily-AI/SHEILY-INICIO-CONNECTOR), [SHEILY-DEPLOYMENT-ORCHESTRATOR](https://github.com/Sheily-AI/SHEILY-DEPLOYMENT-ORCHESTRATOR) | Contratos entre sistemas y releases |
| Interfaces y auditoría | [SHEILY-ANDROID](https://github.com/Sheily-AI/SHEILY-ANDROID), [PROJECT-AUDITOR](https://github.com/Sheily-AI/PROJECT-AUDITOR) | Cliente Android y evidencia técnica |

Los enlaces anteriores corresponden a los nueve repositorios funcionales accesibles en la consulta del inventario. Algunos requieren permiso porque son privados.

## Sistemas independientes

KV-SHEI / M-SLIM y SHEILY no son la misma arquitectura. KV-SHEI trata inferencia y K/V; SHEILY trata la cognición y sus responsabilidades de producto. No se declara integración, disponibilidad del repositorio ni desplegabilidad sin verificar las fuentes actuales de cada sistema.

## Niveles de evidencia

1. **Diseño:** documentación, contratos y límites de cada sistema.
2. **Implementación:** código asociado a una revisión identificable.
3. **Validación:** tests y workflows con registros y condiciones verificables.
4. **Producción:** artefacto, proceso, configuración efectiva y prueba del servicio real.
5. **Continuidad:** persistencia, recuperación y rollback verificados.

Estos niveles no son intercambiables. Una prueba en verde no equivale automáticamente a un servicio funcional.

## Cómo se mantiene esta guía

- [`profile/README.md`](profile/README.md) es la portada visible en GitHub.
- El Markdown se actualiza por cambios revisados; ningún workflow periódico sobrescribe la portada.
- [`scripts/generate_profile.py`](scripts/generate_profile.py), [`profile/catalog.json`](profile/catalog.json) y sus pruebas se conservan únicamente por trazabilidad histórica, no como fuente automática de esta portada.
- GitHub Actions, GitHub Projects y los registros de auditoría siguen siendo mecanismos independientes.
- Los repositorios retirados o inaccesibles no se anuncian como destinos activos sin verificación nueva.
