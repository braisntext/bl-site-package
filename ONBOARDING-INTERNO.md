# Checklist de onboarding — Uso interno BigLobster

Este documento es para el equipo de BigLobster. No compartir con el cliente.

---

## Antes de la reunión de venta

- [ ] Enviar formulario de recogida de datos al cliente (ver FORMULARIO-CLIENTE.md)
- [ ] Confirmar si tienen dominio propio o necesitan uno
- [ ] Confirmar email donde quieren recibir los mensajes de contacto
- [ ] Confirmar que tienen logo en PNG o SVG (fondo transparente)

---

## Setup técnico (20 minutos)

### 1. Crear proyecto en Zeabur
- [ ] Entrar en zeabur.com → New Project
- [ ] Nombre del proyecto: `bl-[nombre-empresa]` (ej: `bl-fontaneria-garcia`)
- [ ] Add Service → Git → seleccionar `braisntext/bl-site-package`
- [ ] Esperar a que el build termine

### 2. Configurar variables de entorno
En Zeabur → tu servicio → Variables:
- [ ] `PANEL_PASSWORD` → contraseña acordada con el cliente
- [ ] `JWT_SECRET` → string aleatorio de 32+ caracteres (usa: `openssl rand -hex 32`)
- [ ] `OPENROUTER_API_KEY` → la API key de OpenRouter de BigLobster
- [ ] `PORT` → `8080`

### 3. Configurar volumen persistente
- [ ] Zeabur → tu servicio → Volumes → Add Volume
- [ ] Nombre: `bl-data`
- [ ] Mount path: `/app/data`
- [ ] Guardar y esperar redeploy

### 4. Primer acceso y configuración
- [ ] Abrir `https://[url-zeabur]/setup`
- [ ] Paso 1: nombre de empresa y sector
- [ ] Paso 2: introducir OPENROUTER_API_KEY
- [ ] Paso 3: confirmar contraseña del panel
- [ ] Acceder a `https://[url-zeabur]/panel`

### 5. Personalización inicial
- [ ] Mi sitio web → Logo → subir logo del cliente
- [ ] Mi sitio web → Páginas → rellenar textos de las 5 páginas (o usar el agente)
- [ ] Mi sitio web → Notificaciones → configurar email del cliente
- [ ] Blog → crear 2-3 artículos iniciales con el agente
- [ ] Verificar que la web pública muestra el contenido correctamente

### 6. Dominio (si procede)
- [ ] Zeabur → Networking → Add Domain → introducir dominio del cliente
- [ ] Pasar al cliente el registro DNS a configurar
- [ ] Verificar que el dominio resuelve correctamente (esperar hasta 1h)
- [ ] Verificar que HTTPS está activo

---

## Entrega al cliente (30 minutos)

- [ ] Compartir URL del panel + contraseña
- [ ] Mostrar cómo publicar un artículo
- [ ] Mostrar cómo usar el agente de chat
- [ ] Mostrar dónde ver los mensajes de contacto
- [ ] Entregar `INSTRUCCIONES-CLIENTE.md` (exportado a PDF)
- [ ] Acordar canal de soporte (WhatsApp, email, etc.)

---

## Post-entrega (primera semana)

- [ ] Verificar a las 24h que el cliente accedió al panel
- [ ] Verificar que los mensajes de contacto llegan al email configurado
- [ ] Resolver dudas iniciales del cliente
- [ ] Anotar feedback para mejoras del producto

---

## Datos del cliente (rellenar por cada instancia)

| Campo | Valor |
|---|---|
| Empresa | |
| Sector | |
| URL Zeabur | |
| Dominio propio | |
| Email notificaciones | |
| Fecha de alta | |
| Estado | En setup / Entregado / Activo |
