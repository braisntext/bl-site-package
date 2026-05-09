import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';

const router = Router();

router.post('/login', (req, res) => {
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
