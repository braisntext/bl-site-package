# Proceso de release — Uso interno

Documento interno para el equipo de BigLobster. Describe cómo sacar un cambio
del paquete `bl-site-package` a producción sin romper los sitios de los
clientes.

`bl-site-package` es un paquete compartido: el mismo código corre en nuestra
instancia de pruebas en Zeabur **y** en el entorno de cada cliente. Por eso
todo cambio pasa primero por pruebas antes de tocar a ningún cliente.

**Nuestro entorno de pruebas** es la instancia de Zeabur `bl-site-package`
(proyecto `biglobster`), servida en `https://blcliente.zeabur.app`. Es la que
auto-despliega desde `main`.

**Los entornos de cliente son distintos entre sí.** El primer cliente,
Shoroban, corre sobre **Plesk/Passenger (Debian)** en `prueba.shoroban.com`
(staging) → `shoroban.com` (producción). Otros clientes futuros pueden usar un
hosting, distribución o panel diferentes. No asumas que "cliente" == "Plesk":
cada uno se verifica por separado.

---

## Flujo (staging-first)

1. **Cambio en una rama** → abre PR contra `main`.
2. **Revisión** → corre `/review` sobre la rama (los cambios de nivel sistema
   son *advisory*: los revisa una persona antes de mergear).
3. **Merge a `main`.**
4. **Zeabur auto-despliega** desde `main` en nuestra instancia de pruebas
   (`https://blcliente.zeabur.app`).
5. **Smoke test** contra pruebas:
   ```bash
   scripts/smoke-test.sh https://blcliente.zeabur.app
   ```
   Debe salir en verde (exit 0). Si falla, **para**: no se toca a ningún
   cliente hasta arreglarlo.
6. **Solo con pruebas en verde**, despliega en el entorno de cada cliente uno
   a uno, y corre el smoke test contra cada uno:
   ```bash
   scripts/smoke-test.sh https://prueba.shoroban.com   # staging del cliente
   scripts/smoke-test.sh https://shoroban.com          # producción del cliente
   ```

Regla de oro: **nunca** se despliega directamente a un cliente sin que el
cambio haya estado verde en pruebas (Zeabur) primero.

---

## Qué cubre pruebas (Zeabur) y qué NO

Nuestra instancia de pruebas corre sobre **Alpine/Docker** (multi-stage
`Dockerfile`, base `node:20-alpine`). Los entornos de cliente corren sobre otra
cosa: el primero, Shoroban, sobre **Plesk/Passenger (Debian)**
(`passenger-startup.cjs`, Node 20); otros clientes pueden diferir. Son entornos
distintos del de pruebas y, potencialmente, distintos entre sí.

Pruebas **sí** detecta:
- Endpoints rotos (500, 404 donde no toca).
- Fallos de arranque (el server no levanta, el build de Eleventy peta).
- Regresiones en funcionalidad compartida (panel, blog, catálogo, reservas).
- Errores de datos/lógica que afectan a todos los clientes por igual.

Pruebas **no** detecta problemas específicos del entorno de cada cliente:
- Compilación de módulos nativos (`better-sqlite3`) en el SO del cliente
  (p. ej. Debian) vs Alpine.
- Rutas, permisos y versión de Node concretas de ese hosting/panel.
- Variables de entorno o almacenamiento mal configurados en un cliente concreto.
- Estado del dominio/DNS/HTTPS de cada cliente.

Por eso la verificación por cliente (paso 6) sigue siendo obligatoria aunque
pruebas esté en verde.

---

## Smoke test

`scripts/smoke-test.sh <base-url>` comprueba los endpoints clave tras un
deploy. Solo necesita `bash` + `curl`. Sale con código distinto de cero si
falla cualquier check, así que sirve para bloquear un release.

Comprueba:
- `GET /api/site/config` → 200 + JSON (arrancaron DB y capa de config).
- `GET /api/blog/posts` → 200 (funciona la ruta de artículos).
- `GET /` → 200 (se sirve el build de Eleventy).
- `GET /setup` → 200 (wizard accesible).
- `GET /panel` → 200 ó 302 (la ruta está cableada; 302 = aún sin configurar,
  redirige a `/setup`).
