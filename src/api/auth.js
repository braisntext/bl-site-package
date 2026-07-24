import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Brute-force cap: the panel has a single shared password, so throttle guesses.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos de acceso. Espera unos minutos.',
});

router.post('/login', loginLimiter, (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contrase\u00f1a requerida' });

  const panelPassword = process.env.PANEL_PASSWORD || getConfig('panel_password');
  if (!panelPassword) {
    return res.status(503).json({ error: 'Panel no configurado. Ve a /setup' });
  }

  if (password !== panelPassword) {
    return res.status(401).json({ error: 'Contrase\u00f1a incorrecta' });
  }

  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });

  const companyName = process.env.CLIENT_COMPANY_NAME || getConfig('company_name') || '';

  res.json({ token, companyName });
});

export default router;
