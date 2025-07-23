import express from "express";
import {addOrUpdateRolePermissions, 
    updateRolesOFUsers,
    getRoles,
    clearRoleMeta,
    getRolesWithUserCount,
    getRolePermissions
} from "../controller/roleController.js";

const router = express.Router();

router.post("/addRole", addOrUpdateRolePermissions);
router.post("/updateUserRole", updateRolesOFUsers);
router.get("/roles",getRoles);
router.patch("/:id/clear-meta",clearRoleMeta);
router.get("/roleCount/:roleName",getRolesWithUserCount);
router.get("/getRole/:roleName",getRolePermissions);


export default router;

