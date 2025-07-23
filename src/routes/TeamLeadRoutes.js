import express from "express";
import {
  createTeamLeadMapping,
  getAllTeamMembers,
  getTeamMemberBySalesId,
  updateTeamMember,
  deleteTeamMember,
  getUnassignedTeamLead,
  getAllTeamLeadBySales,
} from "../controller/teamLeadManagementCon.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addTeamLead", createTeamLeadMapping);
router.get("/getAllTeamLeads", getAllTeamMembers);
router.get("/unassigned", getUnassignedTeamLead);
router.get("/getSales/:salesId", getTeamMemberBySalesId);
router.get("/getAllSalesTeam/:id", authenticate, getAllTeamLeadBySales);
router.patch("/updateTeamLead/:id", updateTeamMember);
router.delete("/deleteTeamLead/:id", deleteTeamMember);

export default router;
