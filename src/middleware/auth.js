import jwt from 'jsonwebtoken';
import { getConfig } from '../db/database.js';

export function verifyJWT(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  const token = header.slice(7);
  const secret = process.env.JWT_SECRET || getConfig('jwt_secret');
  if (!secret) {
    return res.status(503).json({ error: 'Panel no configurado. Ve a /setup' });
  }
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
