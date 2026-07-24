// Minimal in-memory fixed-window rate limiter.
//
// Deliberately dependency-free and keyed on `req.ip`. This package runs one
// container + one SQLite file per client, so an in-process counter is enough;
// if a client ever scales to multiple instances, swap this for a shared-store
// limiter (e.g. express-rate-limit backed by Redis).
//
// NOTE on `req.ip` behind a proxy: we intentionally do NOT enable Express
// `trust proxy`. Enabling it would let clients spoof X-Forwarded-For and bypass
// the limit, and the correct hop count differs per deploy target (Zeabur /
// Plesk-Passenger / Docker). Without it, `req.ip` is the proxy peer, so the
// limiter degrades to per-instance rather than per-IP. That is still an
// effective brute-force cap given the single shared panel password, and the
// public write endpoints pair it with strict length validation.

const buckets = new Map(); // key -> { count, resetAt }

export function rateLimit({ windowMs, max, message }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.baseUrl}${req.path}:${req.ip}`;

    let bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    if (bucket.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res
        .status(429)
        .json({ error: message || "Demasiadas peticiones, inténtalo más tarde." });
    }

    // Opportunistic cleanup so the map can't grow unbounded across many IPs.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
    }

    next();
  };
}
