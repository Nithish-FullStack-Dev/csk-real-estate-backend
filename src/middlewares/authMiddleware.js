import jwt from "jsonwebtoken";
import User from "../modals/user.js";
import Role from "../modals/role.js";

export const authenticate = async (req, res, next) => {
  const {token} = req.cookies;
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await User.findById(decoded.id).populate("role");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const authorize = (page, action) => {
  return (req, res, next) => {
    const rolePermissions = req.user?.role?.permissions;
    const pagePerm = rolePermissions.find((p) => p.page === page);

    if (!pagePerm || !pagePerm.actions[action]) {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  };
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};
