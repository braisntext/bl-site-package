import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db, { getConfig } from "../db/database.js";

const router = Router();
const DEFAULT_AGENT_MODEL = "gpt-oss-20b:free";
const FREE_MODELS_FALLBACK = [
  "gpt-oss-20b:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-4b-it:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

async function requestChatCompletion({ apiKey, model, messages, companyName, sector }) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
  });

  const rawBody = await response.text();
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      rawBody,
      reply: null,
    };
  }

  const data = rawBody ? JSON.parse(rawBody) : {};
  const replyContent =
    data.choices?.[0]?.message?.content || data.choices?.[0]?.text || null;

  return {
    ok: true,
    status: response.status,
    rawBody,
    reply: typeof replyContent === "string" ? replyContent.trim() : null,
  };
}

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
  const configuredModel = getConfig("ai_model")?.trim();
  const model =
    configuredModel && configuredModel !== "null"
      ? configuredModel
      : DEFAULT_AGENT_MODEL;
  const modelsToTry = [
    model,
    ...FREE_MODELS_FALLBACK.filter((candidate) => candidate !== model),
  ];

  const history = db
    .prepare("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 10")
    .all()
    .reverse();

  const messages = [
    ...history.map((r) => ({ role: r.role, content: r.content })),
    { role: "user", content: message },
  ];

  try {
    for (const candidateModel of modelsToTry) {
      const result = await requestChatCompletion({
        apiKey,
        model: candidateModel,
        messages,
        companyName,
        sector,
      });

      if (result.ok && result.reply) {
        db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)").run(
          "user",
          message,
        );
        db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)").run(
          "assistant",
          result.reply,
        );

        return res.json({ reply: result.reply, model: candidateModel });
      }

      if (!result.ok && result.status !== 429) {
        return res
          .status(502)
          .json({ error: "Error al contactar el agente de contenidos." });
      }
    }

    return res.json({
      reply: "El agente está saturado en este momento. Inténtalo en unos segundos.",
    });
  } catch (err) {
    console.error("Chat error:", err);
    res
      .status(500)
      .json({ error: "Error al contactar el agente de contenidos." });
  }
});

export default router;
