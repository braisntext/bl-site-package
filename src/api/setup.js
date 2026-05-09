import { Router } from "express";
import { randomBytes } from "node:crypto";
import db, { getConfig, setConfig } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/status", (req, res) => {
  const configured = !!(
    process.env.PANEL_PASSWORD || getConfig("panel_password")
  );
  res.json({
    configured,
    company_name: getConfig("company_name") || "",
  });
});

router.post("/complete", (req, res) => {
  const { companyName, sector, panelPassword, openrouterApiKey } = req.body;

  if (!companyName || !sector || !panelPassword) {
    return res
      .status(400)
      .json({ error: "companyName, sector y panelPassword son obligatorios" });
  }
  if (panelPassword.length < 8) {
    return res
      .status(400)
      .json({ error: "La contraseña debe tener mínimo 8 caracteres" });
  }

  setConfig("company_name", companyName);
  setConfig("sector", sector);
  setConfig("panel_password", panelPassword);
  if (openrouterApiKey) setConfig("openrouter_api_key", openrouterApiKey);

  if (!getConfig("jwt_secret")) {
    setConfig("jwt_secret", randomBytes(32).toString("hex"));
  }

  res.json({ success: true });
});

router.delete("/reset", requireAuth, (req, res) => {
  const reset = db.transaction(() => {
    db.prepare("DELETE FROM config").run();
    db.prepare("DELETE FROM articles").run();
    db.prepare("DELETE FROM chat_history").run();
    db.prepare("DELETE FROM contact_messages").run();
  });

  reset();

  res.json({ success: true });
});

export default router;
