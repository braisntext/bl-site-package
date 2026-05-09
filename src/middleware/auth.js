import { getConfig } from '../db/database.js';

export function requireAuth(req, res, next) {
  const token = req.headers['x-panel-token'];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const stored = process.env.PANEL_PASSWORD || getConfig('panel_password');
  if (token !== stored) return res.status(401).json({ error: 'No autorizado' });
  next();
}
