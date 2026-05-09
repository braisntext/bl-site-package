import express from 'express';
import multer from 'multer';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, setConfig } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, '../../data/uploads');
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, 'logo.' + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes PNG, JPG, SVG o WebP'));
  }
});

const router = express.Router();

// GET /api/site/config — public, used by public pages
router.get('/config', (req, res) => {
  const keys = [
    'company_name', 'sector',
    'page_index_title', 'page_index_subtitle', 'page_index_desc',
    'page_quienes_title', 'page_quienes_subtitle', 'page_quienes_desc',
    'page_servicios_title', 'page_servicios_subtitle', 'page_servicios_desc',
    'page_contacto_title', 'page_contacto_subtitle', 'page_contacto_desc',
    'page_blog_title', 'page_blog_subtitle',
    'logo_ext', 'ai_model'
  ];
  const config = {};
  for (const k of keys) config[k] = getConfig(k);
  res.json(config);
});

// POST /api/site/texts — save page texts (requires auth)
router.post('/texts', requireAuth, (req, res) => {
  const allowed = [
    'page_index_title', 'page_index_subtitle', 'page_index_desc',
    'page_quienes_title', 'page_quienes_subtitle', 'page_quienes_desc',
    'page_servicios_title', 'page_servicios_subtitle', 'page_servicios_desc',
    'page_contacto_title', 'page_contacto_subtitle', 'page_contacto_desc',
    'page_blog_title', 'page_blog_subtitle',
    'ai_model'
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) setConfig(key, req.body[key]);
  }
  res.json({ success: true });
});

// POST /api/site/logo — upload logo (requires auth)
router.post('/logo', requireAuth, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const ext = req.file.originalname.split('.').pop();
  setConfig('logo_ext', ext);
  res.json({ success: true, path: '/uploads/logo.' + ext });
});

export default router;
