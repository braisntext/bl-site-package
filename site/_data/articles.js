import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import db from "../../src/db/database.js";

marked.setOptions({ breaks: true });

// breaks:true keeps a lone "\n" rendering as <br>, matching the old plain-text
// behavior, so existing posts (no markdown syntax) render unchanged.
function formatContent(text) {
  if (!text) return "";
  return sanitizeHtml(marked.parse(text), {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em",
      "a", "table", "thead", "tbody", "tr", "td", "th", "blockquote",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
    },
  });
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
