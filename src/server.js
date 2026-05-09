import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db, { getConfig } from './db/database.js';
import authRouter from './api/auth.js';
import chatRouter from './api/chat.js';
import blogRouter from './api/blog.js';
import setupRouter from './api/setup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// CSP header
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com; font-src 'self' https://fonts.gstatic.com https://api.fontshare.com; img-src 'self' data:; connect-src 'self' https://openrouter.ai"
  );
  next();
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/blog', blogRouter);
app.use('/api/setup', setupRouter);

// Setup redirect middleware
app.get('/setup', (req, res) => {
  res.sendFile(join(__dirname, '../web/setup.html'));
});

app.get('/panel', (req, res) => {
  const configured = !!(process.env.PANEL_PASSWORD || getConfig('panel_password'));
  if (!configured) return res.redirect('/setup');
  res.sendFile(join(__dirname, '../web/panel.html'));
});

// Static files
app.use(express.static(join(__dirname, '../web')));

// 404
app.use((req, res) => {
  res.status(404).sendFile(join(__dirname, '../web/404.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

app.listen(PORT, () => {
  console.log(`\u{1F99E} bl-site-package running on port ${PORT}`);
  console.log(`   Panel: http://localhost:${PORT}/panel`);
  console.log(`   Setup: http://localhost:${PORT}/setup`);
});

export default app;
