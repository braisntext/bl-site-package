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

console.log("5/6 importando los routers de la API (uno a uno)...");
const routers = [
  "./src/api/auth.js",
  "./src/api/chat.js",
  "./src/api/blog.js",
  "./src/api/contact.js",
  "./src/api/setup.js",
  "./src/api/site.js",
  "./src/api/products.js",
  "./src/api/reservations.js",
  "./src/api/sync.js",
];
for (const path of routers) {
  console.log(`    importando ${path}...`);
  await import(path);
  console.log(`    ${path} ok`);
}
console.log("5/6 routers ok");

console.log(
  "6/6 probando app.listen() en el mismo PORT que usaría Passenger...",
);
console.log("    process.env.PORT =", JSON.stringify(process.env.PORT));
const express = (await import("express")).default;
const testApp = express();
// Puerto 0 = que el SO asigne uno libre, para no chocar con ningún proceso
// que ya esté escuchando en el 3000 (solo probamos que Express puede bindear).
await new Promise((resolve, reject) => {
  const server = testApp.listen(0, () => {
    console.log("6/6 listen ok, escuchando en", server.address());
    server.close(() => resolve());
  });
  server.on("error", (err) => reject(err));
});

console.log("TODO OK — el problema no está en el arranque de la app");
process.exit(0);
