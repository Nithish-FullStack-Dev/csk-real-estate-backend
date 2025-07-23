import express from "express";
import {
  createProperty,
  deleteProperty,
  getCompletedProperties,
  getOncomingProperties,
  getProperties,
  getPropertyById,
  getPurchasableProperties,
  getUpcomingProperties,
  updateProperty,
} from "../controller/propertyController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import csrf from "csurf";

const router = express.Router();
const csrfProtection = csrf({ cookie: true });

// ✅ Routes that require authentication + CSRF + Authorization
router.post(
  "/addProperty",
  csrfProtection,
  authenticate,
  authorize("Properties", "create"),
  createProperty
);

router.put("/updateProperty/:id", updateProperty);

router.delete(
  "/deleteProperty/:id",
  csrfProtection,
  authenticate,
  authorize("Properties", "delete"),
  deleteProperty
);

// ✅ Public GET routes (no auth or CSRF needed)
router.get("/getPropertyById/:id", getPropertyById);
router.get("/getProperties", getProperties);
router.get("/upcoming-properties", getUpcomingProperties);
router.get("/ongoing-properties", getOncomingProperties);
router.get("/completed-properties", getCompletedProperties);
router.get("/available", getPurchasableProperties);

// ✅ Example protected route with permissions
router.get(
  "/properties",
  authenticate,
  authorize("Properties", "read"),
  (req, res) => {
    res.json({ message: "You can read properties!" });
  }
);

export default router;
