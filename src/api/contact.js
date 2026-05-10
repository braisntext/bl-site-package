import { Router } from "express";
import nodemailer from "nodemailer";
import db, { getConfig } from "../db/database.js";
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
router.post("/", async (req, res) => {
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
        html: `<p><strong>Nombre:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><hr><p>${message.replace(/\n/g, "<br>")}</p>`,
      });
    } catch (err) {
      console.error("Error enviando email de notificación:", err.message);
    }
  }

  res.json({ success: true });
});

export default router;
