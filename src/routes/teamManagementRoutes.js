import express from "express";
import {
  addTeamMember,
  deleteTeamAgentById,
  getAllAgentsByTeamLead,
  getTeamAgentById,
  getUnassignedAgents,
  updateTeamAgentById,
} from "../controller/teamManagementController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addTeamMember", addTeamMember);
router.get("/unassigned", getUnassignedAgents);
router.get("/getAllTeam/:id", authenticate, getAllAgentsByTeamLead);
router.get("/getAgentById/:id", getTeamAgentById);
router.patch("/updateTeam/:id", updateTeamAgentById);
router.delete("/deleteTeam/:id", deleteTeamAgentById);

export default router;
