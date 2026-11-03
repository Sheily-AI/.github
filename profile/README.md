# Sheily-AI

**Cognición · inferencia · memoria · adaptación**

Construimos inteligencia artificial local con un criterio común: que cada capacidad pueda entenderse, comprobarse y mantenerse. Sheily-AI reúne tres sistemas diferentes y dos dependencias mantenidas para uno de ellos. Cada repositorio conserva su propia arquitectura, contratos y evidencia.

## El ecosistema

### [SHEILY-COGNITIVA](https://github.com/Sheily-AI/SHEILY-COGNITIVA) · cognición

Sistema cognitivo modular con núcleo Rust. Organiza capacidades, solicitudes, inferencia y memoria bajo reglas de gobernanza y trazabilidad.

### [KV-SHEI](https://github.com/Sheily-AI/KV-SHEI) · inferencia y continuidad K/V

Arquitectura de inferencia y memoria del contexto. Su runtime **M-SLIM** ejecuta modelos locales y trabaja con estado K/V, persistencia, continuidad, validación y evidencia de ejecución.

### [INICIO](https://github.com/Sheily-AI/INICIO) · adaptación gobernada

Runtime en Python para observar dinámicas, evaluar propuestas y controlar cambios estructurales mediante evidencia, persistencia y trazabilidad.

Estos sistemas comparten una dirección de trabajo, pero **son proyectos distintos**. Una función descrita en uno no debe atribuirse automáticamente a los otros ni considerarse desplegada sin comprobar su estado real.

## Dependencias de KV-SHEI

- [KV-SHEI-tch-rs](https://github.com/Sheily-AI/KV-SHEI-tch-rs): fork mantenido de tch/torch-sys para el backend LibTorch.
- [KV-SHEI-tokenizador-rust](https://github.com/Sheily-AI/KV-SHEI-tokenizador-rust): fork mantenido de tokenizers para el procesamiento de tokens.

## Cómo entendemos el estado de una capacidad

El código, las pruebas, el artefacto instalado y su funcionamiento en una ejecución real son evidencias diferentes. La portada describe el propósito de cada sistema; el estado, las limitaciones y las garantías de una capacidad se comprueban en la documentación y los recibos de su repositorio, ligados a la versión correspondiente.

## Acceso

Los cinco repositorios de producto y dependencias son **privados actualmente**. Sus nombres y funciones se muestran aquí, pero los enlaces requieren permisos para consultar el código, los issues o los pull requests. El repositorio .github es público y solo contiene la presentación de la organización.
