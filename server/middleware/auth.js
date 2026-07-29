const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied" });
  }

  // Handle cases where the header format isn't 'Bearer <token>' or token is missing
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Access denied" });
  }

  const token = parts[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    // Differentiate token expiration vs invalid token signature for debugging logs
    if (err.name === "TokenExpiredError") {
      console.warn(`[Auth Middleware] Token expired at ${err.expiredAt}`);
    } else {
      console.error(`[Auth Middleware] Verification failed: ${err.message}`);
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};