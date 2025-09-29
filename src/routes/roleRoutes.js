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
} from "../controller/roleController.js";

const router = express.Router();

router.post("/addRole", addOrUpdateRolePermissions);
router.post("/createRole", createRole);
router.delete("/deleteRole/:id", deleteRole);
router.put("/updateRole/:id", updateRole);

router.post("/updateUserRole", updateRolesOFUsers);
router.get("/roles", getRoles);
router.patch("/:id/clear-meta", clearRoleMeta);
router.get("/roleCount/:roleName", getRolesWithUserCount);
router.get("/getRole/:roleName", getRolePermissions);
router.get("/resetRole/:roleName", resetRolePermissions);

export default router;
