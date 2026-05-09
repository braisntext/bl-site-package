import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';

const router = Router();

router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Contraseña requerida' });

  const panelPassword = process.env.PANEL_PASSWORD || getConfig('panel_password');
  if (!panelPassword) {
    return res.status(503).json({ error: 'Panel no configurado. Ve a /setup' });
  }

  if (password !== panelPassword) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: '24h' });
  res.json({ token });
});

export default router;
