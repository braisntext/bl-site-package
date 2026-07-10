import cron from "node-cron";
import { getConfig } from "../../db/database.js";
import { runLiderpapelSync } from "./sync.js";

const DEFAULT_SCHEDULE = "0 6 * * *";
let started = false;

export function startLiderpapelScheduler() {
  if (started) return;
  started = true;

  const configured = getConfig("liderpapel_sync_schedule") || DEFAULT_SCHEDULE;
  const schedule = cron.validate(configured) ? configured : DEFAULT_SCHEDULE;

  cron.schedule(schedule, () => {
    runLiderpapelSync().catch((err) => {
      console.error("Error en sincronización programada de Liderpapel:", err.message);
    });
  });
}
