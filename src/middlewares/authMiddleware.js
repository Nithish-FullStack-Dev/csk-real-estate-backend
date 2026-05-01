import jwt from "jsonwebtoken";
import User from "../modals/user.js";
import Role from "../modals/role.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT signature + expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Session expired, please login again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    // Fetch user from DB
    const user = await User.findOne({
      _id: decoded.id,
      isDeleted: false,
    }).populate("role");

    if (!user) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
      });

      return res.status(401).json({
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const authorize = (page, action) => {
  return (req, res, next) => {
    const rolePermissions = req.user?.role?.permissions;

    if (!rolePermissions) {
      return res
        .status(403)
        .json({ message: "Access denied: no permissions found" });
    }

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
      return res
        .status(403)
        .json({ message: "Access denied: insufficient role" });
    }
    next();
  };
};
