import express from "express";
import {
  addAgentModel,
  deleteAgentModel,
  getAgentById,
  getAllAgents,
  updateAgentModel,
} from "../controller/agent.controller.js";

const router = express.Router();

router.post("/addAgentList", addAgentModel);

router.get("/getAllAgentsLists", getAllAgents);

router.get("/getAgentsListsById/:id", getAgentById);

router.put("/updateAgent/:id", updateAgentModel);

router.delete("/deleteAgentList/:id", deleteAgentModel);

export default router;
