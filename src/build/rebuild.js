import Eleventy from "@11ty/eleventy";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");
const inputDir = join(root, "site");
const outputDir = join(root, "_site");
const configPath = join(root, "eleventy.config.mjs");

let debounceTimer = null;
let building = false;
let rebuildQueued = false;

async function runBuild() {
  building = true;
  try {
    const elev = new Eleventy(inputDir, outputDir, {
      configPath,
      quietMode: true,
    });
    await elev.write();
  } catch (err) {
    console.error("[BUILD] Eleventy rebuild failed:", err.message);
  } finally {
    building = false;
    if (rebuildQueued) {
      rebuildQueued = false;
      runBuild();
    }
  }
}

// Debounces rapid successive content writes (e.g. multiple setConfig calls
// in one panel save, or a chat-agent edit session) into a single rebuild.
export function scheduleRebuild(delayMs = 400) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    if (building) rebuildQueued = true;
    else runBuild();
  }, delayMs);
}

// _site/ isn't in the persistent volume (only data/ is, see zbpack.json),
// so it's always regenerated fresh from the DB on boot.
export async function buildOnStartup() {
  await runBuild();
}
