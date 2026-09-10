import jwt from "jsonwebtoken";

/**
 * @param {import('express').Request & { user?: any }} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(" ")[1] : null);
    if (!token) {
      return res.status(401).json({ e: "Token required" });
    }
    const user = jwt.verify(token, /** @type {string} */ (process.env.JWT_SECRET));
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ e: "Invalid token" });
  }
};
