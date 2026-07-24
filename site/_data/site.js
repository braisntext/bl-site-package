import { getConfig, PUBLIC_CONFIG_KEYS } from "../../src/db/database.js";

// Eleventy global data — same key set as GET /api/site/config, read directly
// at build time instead of over HTTP.
export default function () {
  const config = { year: new Date().getFullYear() };
  for (const k of PUBLIC_CONFIG_KEYS) config[k] = getConfig(k) || "";
  // site_url env override (SITE_URL) mirrors the runtime pattern used for
  // secrets like PANEL_PASSWORD; trailing slashes are stripped so templates
  // can concatenate absolute URLs without doubling the separator.
  config.site_url = (process.env.SITE_URL || config.site_url || "").replace(/\/+$/, "");
  // Staging (X-Robots-Tag noindex in src/server.js) gates whether SEO
  // artifacts advertise the site — robots.txt/sitemap.xml consult this.
  config.staging = process.env.STAGING === "true";
  return config;
}
