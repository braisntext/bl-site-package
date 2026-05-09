import { Router } from "express";
import db from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// GET /api/contact — inbox del panel
router.get("/", requireAuth, (req, res) => {
  const messages = db
    .prepare(
      "SELECT id, name, email, message, created_at FROM contact_messages ORDER BY datetime(created_at) DESC, id DESC",
    )
    .all();

  res.json({ messages });
});

// POST /api/contact — formulario público
router.post("/", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const message =
    typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "name, email y message son obligatorios" });
  }

  db.prepare(
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)",
  ).run(name, email, message);
  res.json({ success: true });
});

export default router;
