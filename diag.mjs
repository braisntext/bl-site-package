// Diagnóstico temporal de arranque — aísla en qué paso falla/cuelga el
// servidor cuando Passenger solo muestra un error genérico sin stack trace.
// Borrar este fichero (y el script "diag" de package.json) una vez resuelto.

console.log("1/4 boot ok, node", process.version);

console.log("2/4 abriendo la base de datos...");
const db = await import("./src/db/database.js");
console.log("2/4 DB ok, DB_PATH =", process.env.DB_PATH || "./data/app.db");

console.log("3/4 build de Eleventy...");
const { buildOnStartup } = await import("./src/build/rebuild.js");
await buildOnStartup();
console.log("3/4 build ok");

console.log("4/4 arrancando el scheduler de Liderpapel...");
const { startLiderpapelScheduler } = await import(
  "./src/sync/liderpapel/scheduler.js"
);
startLiderpapelScheduler();
console.log("4/4 scheduler ok");

console.log(
  "5/5 probando app.listen() en el mismo PORT que usaría Passenger...",
);
console.log("    process.env.PORT =", JSON.stringify(process.env.PORT));
const express = (await import("express")).default;
const testApp = express();
const PORT = process.env.PORT || 3000;
await new Promise((resolve, reject) => {
  const server = testApp.listen(PORT, () => {
    console.log("5/5 listen ok, escuchando en", server.address());
    server.close(() => resolve());
  });
  server.on("error", (err) => reject(err));
});

console.log("TODO OK — el problema no está en el arranque de la app");
process.exit(0);
