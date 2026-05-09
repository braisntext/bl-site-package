import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';

export function requireAuth(req, res, next) {
  const token = req.headers['x-panel-token'];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const stored = process.env.PANEL_PASSWORD || getConfig('panel_password');
  if (token !== stored) return res.status(401).json({ error: 'No autorizado' });
  next();
}

export function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
