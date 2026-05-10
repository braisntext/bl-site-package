# Conectar dominio propio en Zeabur

## Requisitos
- Acceso al panel DNS de tu dominio (GoDaddy, Namecheap, Cloudflare, etc.)
- El sitio ya desplegado y funcionando en Zeabur

## Pasos

### 1. Añadir el dominio en Zeabur
1. Entra en tu proyecto de Zeabur
2. Haz click en el servicio → pestaña **Networking** o **Domains**
3. Click en **Add Domain**
4. Escribe tu dominio, por ejemplo `tuempresa.com`
5. Zeabur te mostrará un registro DNS que debes añadir

### 2. Configurar el DNS
En el panel de tu proveedor de dominio, añade un registro:
- **Tipo:** CNAME
- **Nombre/Host:** `@` o `www` (según lo que indique Zeabur)
- **Valor:** la URL que te da Zeabur (algo como `tu-servicio.zeabur.app`)
- **TTL:** 300 (o el mínimo disponible)

Si tu proveedor no permite CNAME en el apex (`@`), usa un registro A con la IP que te indique Zeabur.

### 3. HTTPS
Zeabur activa HTTPS automáticamente vía Let's Encrypt una vez que detecta el DNS configurado. No requiere ninguna acción adicional. El proceso tarda entre 5 y 15 minutos.

### 4. Verificar
Una vez propagado el DNS (puede tardar hasta 24h, normalmente menos de 1h):
- `https://tudominio.com/setup` → debe cargar el wizard
- `https://tudominio.com/panel` → debe cargar el panel
- El certificado HTTPS debe aparecer válido en el navegador

## Variables de entorno recomendadas con dominio propio
No es necesario cambiar ninguna variable de entorno para el dominio. El servidor usa rutas relativas en todo momento.