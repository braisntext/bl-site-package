import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';

// Validates x-panel-token as JWT (used by site.js panel routes)
export function requireAuth(req, res, next) {
  const token = req.headers['x-panel-token'];
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  if (!secret) return res.status(503).json({ error: 'Servidor no configurado' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Validates Authorization: Bearer <token> (used by chat/blog routes)
export function verifyJWT(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  if (!secret) return res.status(503).json({ error: 'Servidor no configurado' });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
