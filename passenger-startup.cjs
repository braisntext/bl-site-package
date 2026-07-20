// Passenger's Node.js integration loads el fichero de arranque con require(),
// que no puede cargar un módulo ESM directamente ("type": "module" en
// package.json). Este puente en CommonJS lo carga vía import() dinámico,
// que sí funciona desde CJS. En Plesk, el "Fichero de arranque de la
// aplicación" debe apuntar a este fichero, no a src/server.js.
import("./src/server.js");
