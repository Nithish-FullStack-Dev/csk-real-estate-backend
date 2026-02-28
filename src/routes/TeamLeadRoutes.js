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

router.post("/addTeamLead", authenticate, createTeamLeadMapping);
router.get("/getAllTeamLeads", authenticate, getAllTeamMembers);
router.get("/unassigned", authenticate, getUnassignedTeamLead);
router.get("/getSales/:salesId", authenticate, getTeamMemberBySalesId);
router.get("/getAllSalesTeam", authenticate, getAllTeamLeadBySales);

router.patch("/updateTeamLead/:id", authenticate, updateTeamMember);
router.delete("/deleteTeamLead/:id", authenticate, deleteTeamMember);

export default router;
