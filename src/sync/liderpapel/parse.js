import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import {
  CSV_OPTIONS,
  CATALOG_COLUMNS,
  PRICES_COLUMNS,
  STOCKS_COLUMNS,
  CATEGORIES_COLUMNS,
  DESCRIPTIONS_COLUMNS,
  MULTIMEDIA_COLUMNS,
} from "./mapping.js";

function parseCsvFile(path) {
  const raw = readFileSync(path, { encoding: CSV_OPTIONS.encoding });
  return parse(raw, {
    delimiter: CSV_OPTIONS.delimiter,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
}

function toSlug(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toCents(value) {
  const n = parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

// Joins the 7 CSVs by SKU into normalized product objects, keyed by SKU.
// RelationedProducts is parsed for plumbing but deliberately not joined in
// (cross-sell is out of scope for this phase).
export function joinLiderpapelCatalog(paths) {
  const catalogRows = parseCsvFile(paths.catalog);
  const priceRows = parseCsvFile(paths.prices);
  const stockRows = parseCsvFile(paths.stocks);
  const categoryRows = parseCsvFile(paths.categories);
  const descriptionRows = parseCsvFile(paths.descriptions);
  const multimediaRows = parseCsvFile(paths.multimedia);

  const priceBySku = new Map(priceRows.map((r) => [r[PRICES_COLUMNS.sku], r]));
  const stockBySku = new Map(stockRows.map((r) => [r[STOCKS_COLUMNS.sku], r]));
  const descriptionBySku = new Map(
    descriptionRows.map((r) => [r[DESCRIPTIONS_COLUMNS.sku], r]),
  );
  const categoryNameByCode = new Map(
    categoryRows.map((r) => [r[CATEGORIES_COLUMNS.categoryCode], r[CATEGORIES_COLUMNS.categoryName]]),
  );
  const imageBySku = new Map();
  for (const row of multimediaRows) {
    const sku = row[MULTIMEDIA_COLUMNS.sku];
    if (sku && !imageBySku.has(sku)) imageBySku.set(sku, row[MULTIMEDIA_COLUMNS.imageUrl]);
  }

  const products = new Map();
  for (const row of catalogRows) {
    const sku = row[CATALOG_COLUMNS.sku];
    if (!sku) continue;

    const priceRow = priceBySku.get(sku);
    const stockRow = stockBySku.get(sku);
    const descRow = descriptionBySku.get(sku);
    const name = row[CATALOG_COLUMNS.name] || sku;

    products.set(sku, {
      sku,
      slug: toSlug(`${sku}-${name}`),
      name,
      description: descRow?.[DESCRIPTIONS_COLUMNS.descriptionHtml] || "",
      category: categoryNameByCode.get(row[CATALOG_COLUMNS.categoryCode]) || "",
      price_cents: priceRow ? toCents(priceRow[PRICES_COLUMNS.priceEur]) : 0,
      stock_qty: stockRow ? parseInt(stockRow[STOCKS_COLUMNS.stockQty], 10) || 0 : 0,
      image_url: imageBySku.get(sku) || null,
      feed_active: 1,
    });
  }

  return products;
}
