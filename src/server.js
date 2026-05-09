import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';
import db, { getConfig } from './db/database.js';
import authRouter from './api/auth.js';
import chatRouter from './api/chat.js';
import blogRouter from './api/blog.js';
import setupRouter from './api/setup.js';
import siteRouter from './api/site.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads folder is served
const uploadsDir = join(__dirname, '../data/uploads');
mkdirSync(uploadsDir, { recursive: true });

// Middlewares
app.use(cors());
app.use(express.json());

// CSP header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; font-src 'self' https://fonts.gstatic.com https://api.fontshare.com; img-src 'self' data: blob:; connect-src 'self' https://openrouter.ai"
  );
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/blog', blogRouter);
app.use('/api/setup', setupRouter);
app.use('/api/site', siteRouter);

// Panel & Setup routes
app.get('/setup', (req, res) => res.sendFile(join(__dirname, '../web/setup.html')));
app.get('/panel', (req, res) => {
  const configured = !!(process.env.PANEL_PASSWORD || getConfig('panel_password'));
  if (!configured) return res.redirect('/setup');
  res.sendFile(join(__dirname, '../web/panel.html'));
});

// Public site pages
const pages = ['quienes-somos', 'servicios', 'contacto', 'blog'];
for (const p of pages) {
  app.get('/' + p, (req, res) => res.sendFile(join(__dirname, '../web/' + p + '.html')));
}

// Static files
app.use(express.static(join(__dirname, '../web')));

// 404
app.use((req, res) => {
  res.status(404).sendFile(join(__dirname, '../web/404.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

app.listen(PORT, () => {
  console.log(`🦞 bl-site-package running on port ${PORT}`);
  console.log(`   Panel: http://localhost:${PORT}/panel`);
  console.log(`   Setup: http://localhost:${PORT}/setup`);
});

export default app;
