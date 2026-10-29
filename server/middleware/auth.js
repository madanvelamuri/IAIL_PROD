
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

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({
      message: "Access denied. Invalid token format.",
      code: "INVALID_TOKEN_FORMAT",
    });
  }

  if (!parts[1]) {
    return res.status(401).json({
      message: "Access denied. Token missing.",
      code: "NO_TOKEN",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET environment variable is missing.");

    return res.status(500).json({
      message: "Internal server error.",
      code: "MISSING_SERVER_SECRET",
    });
  }

  try {
    const verified = jwt.verify(
      parts[1],
      process.env.JWT_SECRET
    );

    const userId = verified.id ?? verified.userId;

    if (
      userId === undefined ||
      userId === null ||
      !/^[1-9]\d*$/.test(String(userId))
    ) {
      return res.status(401).json({
        message: "Token does not contain a valid user ID.",
        code: "INVALID_TOKEN_PAYLOAD",
      });
    }

    req.user = {
      id: String(userId),
    };

    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired. Please log in again.",
        code: "TOKEN_EXPIRED",
      });
    }

    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      message: "Invalid or corrupted token.",
      code: "INVALID_TOKEN",
    });
  }
};
