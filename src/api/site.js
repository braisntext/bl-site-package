import express from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getConfig, setConfig, PUBLIC_CONFIG_KEYS } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadsDir = join(__dirname, "../../data/uploads");
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, "logo." + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes PNG, JPG, SVG o WebP"));
  },
});

const router = express.Router();

// GET /api/site/config — public
router.get("/config", (req, res) => {
  const config = {};
  for (const k of PUBLIC_CONFIG_KEYS) config[k] = getConfig(k);
  res.json(config);
});

// POST /api/site/texts — save page texts
router.post("/texts", requireAuth, (req, res) => {
  const allowed = [
    "page_index_title",
    "page_index_subtitle",
    "page_index_desc",
    "page_quienes_title",
    "page_quienes_subtitle",
    "page_quienes_desc",
    "page_servicios_title",
    "page_servicios_subtitle",
    "page_servicios_desc",
    "page_contacto_title",
    "page_contacto_subtitle",
    "page_contacto_desc",
    "page_blog_title",
    "page_blog_subtitle",
    "smtp_host",
    "smtp_port",
    "smtp_user",
    "smtp_pass",
    "notify_email",
    "ai_model",
    "whatsapp_number",
    "legal_name",
    "legal_id",
    "legal_address",
    "legal_email",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) setConfig(key, req.body[key]);
  }
  res.json({ success: true });
});

// POST /api/site/logo — upload logo
router.post("/logo", requireAuth, upload.single("logo"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "No se recibió ningún archivo" });
  const ext = req.file.originalname.split(".").pop();
  setConfig("logo_ext", ext);
  res.json({ success: true, path: "/uploads/logo." + ext });
});

// GET /api/site/models?q=term — proxy OpenRouter model list
router.get("/models", requireAuth, async (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  const apiKey =
    process.env.OPENROUTER_API_KEY?.trim() ||
    getConfig("openrouter_api_key")?.trim();
  try {
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers,
    });
    const data = await response.json();
    let models = (data.data || []).map((m) => ({
      id: m.id,
      name: m.name || m.id,
      pricing: m.pricing || null,
    }));
    if (q)
      models = models.filter(
        (m) =>
          m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q),
      );
    res.json({ models: models.slice(0, 30) });
  } catch (err) {
    console.error("Models fetch error:", err);
    res
      .status(500)
      .json({ error: "No se pudo obtener la lista de modelos", models: [] });
  }
});

export default router;
