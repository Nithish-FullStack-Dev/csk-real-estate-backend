import express from "express";
import {
  addTeamMember,
  deleteTeamAgentById,
  getAllAgentsByTeamLead,
  getAllTeamMembers,
  getTeamAgentById,
  getUnassignedAgents,
  updateTeamAgentById,
} from "../controller/teamManagementController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addTeamMember", authenticate, addTeamMember);
router.get("/unassigned", authenticate, getUnassignedAgents);
router.get("/getAllTeam", authenticate, getAllAgentsByTeamLead);
router.get("/getAllTeamMembers", authenticate, getAllTeamMembers);
router.get("/getAgentById/:id", authenticate, getTeamAgentById);
router.patch("/updateTeam/:id", authenticate, updateTeamAgentById);
router.delete("/deleteTeam/:id", authenticate, deleteTeamAgentById);

export default router;
