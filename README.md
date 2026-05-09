# bl-site-package

Paquete web deployable para clientes SMB. Incluye sitio público, panel de gestión, blog, bandeja de mensajes y agente de marketing con IA.

## Deploy en 5 minutos

1. Conecta este repo en [Zeabur](https://zeabur.com).
2. Abre `tudominio.com/setup`.
3. Completa el wizard con empresa, sector, OpenRouter API Key y contraseña del panel.
4. Accede a `tudominio.com/panel`.
5. Publica y personaliza el sitio desde el panel.

## Modelo por defecto

El agente usa por defecto `gpt-oss-20b:free`, un modelo gratuito de OpenRouter que cubre el flujo base.

## Páginas incluidas

- Inicio
- Quiénes somos
- Servicios
- Contacto
- Blog

## Funcionalidades del panel

- Gestión de blog: crear, editar, publicar y eliminar artículos.
- Agente de marketing con IA mediante OpenRouter.
- Configuración de páginas, textos y logo.
- Bandeja de mensajes enviados desde el formulario de contacto.
- Reseteo completo desde Ajustes para volver al onboarding.

## Variables de entorno

| Variable              | Descripción                                                 | Default                                 |
| --------------------- | ----------------------------------------------------------- | --------------------------------------- |
| `PORT`                | Puerto del servidor                                         | `3000`                                  |
| `PANEL_PASSWORD`      | Contraseña del panel, opcional si se guarda desde el wizard | vacío                                   |
| `JWT_SECRET`          | Secret JWT, opcional si se genera desde el wizard           | vacío                                   |
| `OPENROUTER_API_KEY`  | API key de OpenRouter                                       | vacío                                   |
| `CONTENT_AGENT_MODEL` | Modelo OpenRouter para el agente de contenidos              | `gpt-oss-20b:free` |
| `CLIENT_COMPANY_NAME` | Nombre de la empresa                                        | vacío                                   |
| `CLIENT_SECTOR`       | Sector de la empresa                                        | vacío                                   |
| `DB_PATH`             | Ruta a la base de datos SQLite                              | `./data/app.db`                         |

Si estas variables están vacías, el asistente de inicio en `/setup` guarda la configuración en SQLite.

## Estructura

```
bl-site-package/
├── src/
│   ├── server.js          # Entry point Express
│   ├── middleware/
│   │   └── auth.js        # Middleware JWT
│   ├── db/
│   │   └── database.js    # SQLite init + schema
│   └── api/
│       ├── auth.js        # POST /api/auth/login
│       ├── chat.js        # POST /api/chat/send
│       ├── blog.js        # CRUD /api/blog/posts
│       ├── contact.js     # GET/POST /api/contact
│       ├── setup.js       # GET/POST/DELETE /api/setup
│       └── site.js        # Config, logo y modelos OpenRouter
└── web/
    ├── index.html         # Sitio público
    ├── quienes-somos.html # Página Quiénes somos
    ├── servicios.html     # Página Servicios
    ├── contacto.html      # Página Contacto
    ├── blog.html          # Página Blog
    ├── panel.html         # Panel de gestión
    ├── panel.js           # JS del panel
    ├── style-panel.css    # CSS del panel
    ├── setup.html         # Wizard de onboarding
    └── setup.js           # JS del wizard
```
