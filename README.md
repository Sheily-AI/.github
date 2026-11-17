# SHEILY · GitHub Pages (interfaz estática)

Instantánea pública de la consola web real de SHEILY. Fuente privada: `Sheily-AI/SHEILY-COGNITIVA`, commit `83ee5f1eb8edc81cbe2f0dc4ecefc27e586f4225`, ruta `cognition/native/sheily-cognitive-console-rs/web/`.

## Activación gratuita de Pages

En el repositorio `Sheily-AI/.github`, abrir **Settings → Pages → Build and deployment**; Source: **Deploy from a branch**; Branch: **sheily-pages**; Folder: **/(root)**; pulsar **Save**. La URL prevista para este sitio de proyecto es `https://sheily-ai.github.io/.github/`. Un enlace previsto no acredita que Pages esté habilitado ni que el sitio esté en línea.

## Límites y seguridad

Esta rama solo contiene frontend HTML/CSS/JavaScript y licencias. No contiene modelos, API Rust, bases de datos, claves ni estados privados. Se sustituyeron nombres personales codificados en el HTML/JavaScript por valores genéricos y se adaptaron rutas estáticas al prefijo `/.github/`.

**El chat en vivo, la memoria y los controles no funcionan aún desde GitHub Pages.** La consola existente requiere cookies/sesión de mismo origen, rutas `/api/*` y eventos. GitHub Pages no ejecuta Rust ni ofrece proxy dinámico. El archivo `assets/pages-guard.js` bloquea peticiones locales `/api/*`, `/health`, `/ready` y protege contra el envío accidental de contraseñas a GitHub Pages. Este bloqueo no debe retirarse antes de que exista transporte autenticado, TLS, controles de origen/CSRF y pruebas E2E.

El backend permanece privado y sin modificaciones. La rama principal `main` de `Sheily-AI/.github` no se altera. Esta instantánea no se sincroniza automáticamente con futuras revisiones privadas.
