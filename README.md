# bl-site-package

Paquete web deployable para clientes SMB. Incluye sitio público, panel de gestión y agente de contenidos IA.

## Deploy en 5 minutos

1. Conecta este repo en [Zeabur](https://zeabur.com)
2. Abre `tudominio.com/setup`
3. Completa el wizard (empresa, sector, OpenRouter API Key, contraseña del panel)
4. Accede a `tudominio.com/panel`
5. ¡Listo!

## Variables de entorno opcionales

| Variable              | Descripción                      | Default                                 |
| --------------------- | -------------------------------- | --------------------------------------- |
| `PORT`                | Puerto del servidor              | `3000`                                  |
| `CONTENT_AGENT_MODEL` | Modelo OpenRouter para el agente | `meta-llama/llama-3.1-8b-instruct:free` |
| `DB_PATH`             | Ruta a la base de datos SQLite   | `./data/app.db`                         |

Todas las demás variables (contraseña, API key, nombre empresa) se configuran desde el wizard en `/setup`.

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
│       ├── chat.js        # POST /api/chat
│       ├── blog.js        # CRUD /api/blog
│       └── setup.js       # GET/POST /api/setup
└── web/
    ├── index.html         # Sitio público
    ├── panel.html         # Panel de gestión
    ├── panel.js           # JS del panel
    ├── style-panel.css    # CSS del panel
    ├── setup.html         # Wizard de onboarding
    └── setup.js           # JS del wizard
```
