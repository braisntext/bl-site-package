import db from "../../src/db/database.js";

export default function () {
  const rows = db
    .prepare(
      "SELECT DISTINCT category FROM products WHERE active = 1 AND category != '' ORDER BY category COLLATE NOCASE",
    )
    .all();
  return rows.map((r) => r.category);
}
