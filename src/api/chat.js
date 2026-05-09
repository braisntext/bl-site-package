import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db, { getConfig } from "../db/database.js";

const router = Router();
const DEFAULT_AGENT_MODEL = "meta-llama/llama-3.1-8b-instruct:free";

// POST /api/chat/send
router.post("/send", requireAuth, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Mensaje requerido" });

  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim() ||
    getConfig("openrouter_api_key")?.trim();
  if (!apiKey) {
    return res.json({
      reply:
        "Configura tu OpenRouter API Key en /setup para activar el agente de contenidos.",
    });
  }

  const companyName =
    process.env.CLIENT_COMPANY_NAME ||
    getConfig("company_name") ||
    "la empresa";
  const sector =
    process.env.CLIENT_SECTOR || getConfig("sector") || "industria";
  const model = getConfig("ai_model") || DEFAULT_AGENT_MODEL;

  const history = db
    .prepare("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 10")
    .all()
    .reverse();

  const messages = [
    ...history.map((r) => ({ role: r.role, content: r.content })),
    { role: "user", content: message },
  ];

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/braisntext/bl-site-package",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: `Eres el agente de contenidos de ${companyName}, empresa del sector ${sector}. Tu especialidad es crear contenido de marketing: artículos de blog, textos web, posts para redes sociales. Responde siempre en español. Sé directo, práctico y orientado a resultados.`,
            },
            ...messages,
          ],
        }),
      },
    );

    const rawBody = await response.text();
    if (!response.ok) {
      return res
        .status(502)
        .json({ error: "Error al contactar el agente de contenidos." });
    }

    const data = rawBody ? JSON.parse(rawBody) : {};
    const reply =
      data.choices?.[0]?.message?.content || "Sin respuesta del agente.";

    db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)").run(
      "user",
      message,
    );
    db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)").run(
      "assistant",
      reply,
    );

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res
      .status(500)
      .json({ error: "Error al contactar el agente de contenidos." });
  }
});

export default router;
