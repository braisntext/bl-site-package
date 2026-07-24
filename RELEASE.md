# Proceso de release — Uso interno

Documento interno para el equipo de BigLobster. Describe cómo sacar un cambio
del paquete `bl-site-package` a producción sin romper los sitios de los
clientes.

`bl-site-package` es un paquete compartido: el mismo código corre en la
instancia de staging de Zeabur **y** en cada servidor de cliente (Plesk). Por
eso todo cambio pasa primero por staging antes de tocar a ningún cliente.

---

## Flujo (staging-first)

1. **Cambio en una rama** → abre PR contra `main`.
2. **Revisión** → corre `/review` sobre la rama (los cambios de nivel sistema
   son *advisory*: los revisa una persona antes de mergear).
3. **Merge a `main`.**
4. **Zeabur (dev) auto-despliega** desde `main`. Es la instancia de staging
   (`https://prueba.shoroban.com`, `STAGING=true`, `noindex`).
5. **Smoke test** contra staging:
   ```bash
   scripts/smoke-test.sh https://prueba.shoroban.com
   ```
   Debe salir en verde (exit 0). Si falla, **para**: no se toca a ningún
   cliente hasta arreglarlo.
6. **Solo con staging en verde**, despliega en los servidores de cliente
   (Plesk) uno a uno, y corre el smoke test contra cada uno:
   ```bash
   scripts/smoke-test.sh https://www.dominio-del-cliente.com
   ```

Regla de oro: **nunca** se despliega directamente a un cliente sin que el
cambio haya estado verde en staging primero.

---

## Qué cubre staging y qué NO

Zeabur corre sobre **Alpine/Docker** (multi-stage `Dockerfile`, base
`node:20-alpine`). Los clientes corren sobre **Plesk/Passenger (Debian)**
(`passenger-startup.cjs`, Node 20). Son entornos distintos.

Staging **sí** detecta:
- Endpoints rotos (500, 404 donde no toca).
- Fallos de arranque (el server no levanta, el build de Eleventy peta).
- Regresiones en funcionalidad compartida (panel, blog, catálogo, reservas).
- Errores de datos/lógica que afectan a todos los clientes por igual.

Staging **no** detecta problemas específicos del entorno de cada cliente:
- Compilación de módulos nativos (`better-sqlite3`) en Debian vs Alpine.
- Rutas, permisos y versión de Node concretas de cada Plesk.
- Variables de entorno o volúmenes mal configurados en un cliente concreto.
- Estado del dominio/DNS/HTTPS de cada cliente.

Por eso la verificación por cliente (paso 6) sigue siendo obligatoria aunque
staging esté en verde.

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
