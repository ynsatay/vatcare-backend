import rateLimit from "express-rate-limit";

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
const max = Number(process.env.RATE_LIMIT_MAX ?? 120);

const authWindowMs = Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS ?? 60_000);
const authMax = Number(process.env.RATE_LIMIT_AUTH_MAX ?? 10);

function rateLimitResponse(req, res, _next, options) {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  return res.status(options.statusCode).json({
    status: "error",
    error: options.message,
    retryAfterSeconds,
  });
}

export const apiLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.",
  handler: rateLimitResponse,
  skip: (req) => req.path === "/login",
});

export const loginLimiter = rateLimit({
  windowMs: authWindowMs,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin.",
  handler: rateLimitResponse,
});
