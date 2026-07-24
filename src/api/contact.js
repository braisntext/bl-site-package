import { Router } from "express";
import nodemailer from "nodemailer";
import db, { getConfig } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// Public endpoint: cap volume to blunt spam/DB-flooding.
const contactLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

const MAX_NAME = 200;
const MAX_EMAIL = 200;
const MAX_MESSAGE = 5000;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
router.post("/", contactLimiter, async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
  const message =
    typeof req.body.message === "string" ? req.body.message.trim() : "";

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "name, email y message son obligatorios" });
  }

  if (
    name.length > MAX_NAME ||
    email.length > MAX_EMAIL ||
    message.length > MAX_MESSAGE
  ) {
    return res.status(400).json({ error: "Uno de los campos es demasiado largo" });
  }

  db.prepare(
    "INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)",
  ).run(name, email, message);

  const smtpHost = process.env.SMTP_HOST || getConfig("smtp_host");
  const smtpPort = parseInt(
    process.env.SMTP_PORT || getConfig("smtp_port") || "587",
    10,
  );
  const smtpUser = process.env.SMTP_USER || getConfig("smtp_user");
  const smtpPass = process.env.SMTP_PASS || getConfig("smtp_pass");
  const notifyEmail = process.env.NOTIFY_EMAIL || getConfig("notify_email");

  if (smtpHost && smtpUser && smtpPass && notifyEmail) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"${name}" <${smtpUser}>`,
        to: notifyEmail,
        subject: `Nuevo mensaje de contacto de ${name}`,
        text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
        html: `<p><strong>Nombre:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><hr><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      });
    } catch (err) {
      console.error("Error enviando email de notificación:", err.message);
    }
  }

  res.json({ success: true });
});

export default router;
