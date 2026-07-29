const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Ensure header follows 'Bearer <token>' format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Access denied. Invalid token format." });
  }

  const token = parts[1]?.trim();

  if (!token) {
    return res.status(401).json({ message: "Access denied. Token missing." });
  }

  // Safety check: ensure JWT_SECRET is present in production env
  if (!process.env.JWT_SECRET) {
    console.error("[Auth Middleware] Fatal: JWT_SECRET environment variable is missing.");
    return res.status(500).json({ message: "Internal server error" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.warn(`[Auth Middleware] Token expired at ${err.expiredAt}`);
      return res.status(401).json({ message: "Token has expired", code: "TOKEN_EXPIRED" });
    }

    console.error(`[Auth Middleware] Verification failed: ${err.message}`);
    return res.status(401).json({ message: "Invalid or corrupted token", code: "INVALID_TOKEN" });
  }
};