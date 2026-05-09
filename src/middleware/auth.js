import jwt from "jsonwebtoken";
import { getConfig } from "../db/database.js";

export function extractRequestToken(req) {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const panelToken = req.headers["x-panel-token"];
  return typeof panelToken === "string" ? panelToken : null;
}

function getJwtSecret() {
  return process.env.JWT_SECRET || getConfig("jwt_secret");
}

// Validates JWT token from Authorization Bearer or x-panel-token
export function requireAuth(req, res, next) {
  const token = extractRequestToken(req);
  if (!token) return res.status(401).json({ error: "No autorizado" });
  const secret = getJwtSecret();
  if (!secret)
    return res.status(503).json({ error: "Servidor no configurado" });
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Backward-compatible alias used across API routes
export const verifyJWT = requireAuth;
