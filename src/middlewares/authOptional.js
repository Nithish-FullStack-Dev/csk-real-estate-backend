import jwt from "jsonwebtoken";

export const authOptional = (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = { id: decoded.userId || decoded.id };
    next();
  } catch {
    req.user = null;
    next();
  }
};
