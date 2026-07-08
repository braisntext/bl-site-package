// bl-site-package — Eleventy config
// Input: site/ (Nunjucks templates). Data: site/_data/* reads live SQLite
// content at build time (config table + articles), not static files — the
// customer panel/chat agent still writes to the DB; every write schedules a
// rebuild (see src/build/rebuild.js) so this stays in sync.
// Output: _site/ (served by Express via express.static, see src/server.js).

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "web/style.css": "style.css" });
  eleventyConfig.addPassthroughCopy({ "web/site.js": "site.js" });

  return {
    dir: {
      input: "site",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
}
