import express from "express";
import {
  addAgentModel,
  deleteAgentModel,
  getAgentById,
  getAllAgents,
  getAllAgentsForDropDown,
  restoreAgent,
  updateAgentModel,
} from "../controller/agent.controller.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/addAgentList", authenticate, addAgentModel);

router.get("/getAllAgentsLists", getAllAgents);

router.get("/getAllAgentsListsForDropDown", getAllAgentsForDropDown);

router.get("/getAgentsListsById/:id", getAgentById);

router.put("/updateAgent/:id", updateAgentModel);

router.delete("/deleteAgentList/:id", authenticate, deleteAgentModel);

router.patch("/restore/:_id", authenticate, restoreAgent);

export default router;
