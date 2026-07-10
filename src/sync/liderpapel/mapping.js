// UNVERIFIED: column names, delimiter and encoding below are best-guess
// placeholders based on public integrator documentation for Liderpapel's
// standard sFTP catalog feed (LiveCommerce, Informax). They have NOT been
// confirmed against a live sample from Shoroban's account — the connectivity
// spike that would confirm them is blocked pending explicit authorization
// to run a command containing the sFTP password (see project notes).
//
// Once a real sample is available, this should be the ONLY file that needs
// editing to fix the field mapping.

export const CSV_OPTIONS = {
  delimiter: ";",
  encoding: "latin1",
};

// Liderpapel's documented filename pattern is "<Name>_es_ES_<code>.csv" —
// the numeric/code suffix is account-specific, so files are matched by
// prefix rather than exact name (see client.js's resolveFeedFiles()).
export const FILENAME_PREFIXES = {
  catalog: "Catalog",
  prices: "Prices",
  stocks: "Stocks",
  categories: "Categories",
  descriptions: "Descriptions",
  multimedia: "MultimediaLinks",
  related: "RelationedProducts",
};

export const CATALOG_COLUMNS = {
  sku: "Codigo",
  name: "Descripcion",
  categoryCode: "CodigoCategoria",
};

export const PRICES_COLUMNS = {
  sku: "Codigo",
  priceEur: "PVP",
};

export const STOCKS_COLUMNS = {
  sku: "Codigo",
  stockQty: "Stock",
};

export const CATEGORIES_COLUMNS = {
  categoryCode: "Codigo",
  categoryName: "Descripcion",
};

export const DESCRIPTIONS_COLUMNS = {
  sku: "Codigo",
  descriptionHtml: "DescripcionLarga",
};

export const MULTIMEDIA_COLUMNS = {
  sku: "Codigo",
  imageUrl: "URL",
};
