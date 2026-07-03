const DEFAULT_ALLOWED_ORIGINS = new Set([
  'https://www.carmatch.vn',
  'https://carmatch.vn',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5177',
  'http://127.0.0.1:5177',
]);

const counters = new Map();

function isAllowedOrigin(origin) {
  if (!origin) return true;
  return (
    DEFAULT_ALLOWED_ORIGINS.has(origin) ||
    /^https:\/\/carmatch-web-[a-z0-9-]+\.vercel\.app$/i.test(origin) ||
    /^https:\/\/carmatch-web\.vercel\.app$/i.test(origin)
  );
}

export function applyCors(req, res, options = {}) {
  const {
    methods = 'GET,POST,OPTIONS',
    headers = 'Content-Type, Authorization',
    allowAnyOrigin = false,
  } = options;
  const origin = req.headers.origin || '';

  if (allowAnyOrigin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
}

export function isPreflightAllowed(req) {
  return isAllowedOrigin(req.headers.origin || '');
}

export function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

export function rateLimit(req, res, options = {}) {
  const {
    id = 'default',
    windowMs = 60_000,
    max = 60,
    key = clientIp(req),
  } = options;
  const now = Date.now();
  const bucketKey = `${id}:${key}`;
  let bucket = counters.get(bucketKey);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  counters.set(bucketKey, bucket);

  if (counters.size > 5000) {
    for (const [candidateKey, candidate] of counters) {
      if (candidate.resetAt <= now) counters.delete(candidateKey);
    }
  }

  const remaining = Math.max(0, max - bucket.count);
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(remaining));

  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau ít phút.' });
    return false;
  }

  return true;
}
