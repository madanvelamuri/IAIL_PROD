
const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Access denied. No token provided.",
      code: "NO_TOKEN",
    });
  }

  const parts = authHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
    return res.status(401).json({
      message: "Invalid authorization header. Use Bearer token.",
      code: "INVALID_AUTH_HEADER",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing.");

    return res.status(500).json({
      message: "Server authentication configuration error.",
      code: "JWT_SECRET_MISSING",
    });
  }

  try {
    const verified = jwt.verify(parts[1], process.env.JWT_SECRET);

    // Keep the verified token payload.
    // The login route must include the database user's ID.
    req.user = verified;

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({
      message: "Invalid token. Please log in again.",
      code: "INVALID_TOKEN",
    });
  }
};
