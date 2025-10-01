import express from "express";
import {
  addOrUpdateRolePermissions,
  updateRolesOFUsers,
  getRoles,
  clearRoleMeta,
  getRolesWithUserCount,
  getRolePermissions,
  createRole,
  deleteRole,
  updateRole,
  resetRolePermissions,
  getRoleByUser,
} from "../controller/roleController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addRole", addOrUpdateRolePermissions);
router.post("/createRole", createRole);
router.delete("/deleteRole/:id", deleteRole);
router.put("/updateRole/:id", updateRole);
router.get("/getRoleByUser", authenticate, getRoleByUser);

router.post("/updateUserRole", updateRolesOFUsers);
router.get("/roles", getRoles);
router.patch("/:id/clear-meta", clearRoleMeta);
router.get("/roleCount/:roleName", getRolesWithUserCount);
router.get("/getRole/:roleName", getRolePermissions);
router.get("/resetRole/:roleName", resetRolePermissions);

export default router;
