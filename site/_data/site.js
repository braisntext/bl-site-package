import { getConfig, PUBLIC_CONFIG_KEYS } from "../../src/db/database.js";

// Eleventy global data — same key set as GET /api/site/config, read directly
// at build time instead of over HTTP.
export default function () {
  const config = { year: new Date().getFullYear() };
  for (const k of PUBLIC_CONFIG_KEYS) config[k] = getConfig(k) || "";
  return config;
}
