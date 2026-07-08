import db from "../../src/db/database.js";

// Mirrors formatContent()/toLocaleDateString("es-ES") from the old client
// renderer, precomputed here since Nunjucks has no equivalent built in.
function formatContent(text) {
  if (!text) return "";
  return text
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export default function () {
  const rows = db
    .prepare(
      "SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC",
    )
    .all();
  return rows.map((a) => ({
    ...a,
    contentHtml: formatContent(a.content),
    dateEs: new Date(a.created_at).toLocaleDateString("es-ES"),
  }));
}
