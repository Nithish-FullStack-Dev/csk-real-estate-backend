import express from "express";
import {
  createProject,
  getUserProjects,
  getUserTasks,
  getContractorsForSiteIncharge,
  updateTask,
  getContractorTasksUnderSiteIncharge,
  updateTaskByIdForContractor,
  updateTaskByIdForSiteIncharge,
  addContractorForSiteIncharge,
  assignTaskToContractor,
  miniUpdateTaskByIdForContractor,
  createTaskForProjectUnit,
  assignContractorToUnit
} from "../controller/projectControllers.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create-project", createProject);
router.get("/projects", authenticate, getUserProjects);
router.get("/tasks", authenticate, getUserTasks);
router.get(
  "/site-incharge/myContractors",
  authenticate,
  getContractorsForSiteIncharge
);
router.post("/update-task", authenticate, updateTask);
router.get(
  "/site-incharge/:contractorId/contractor/tasks",
  authenticate,
  getContractorTasksUnderSiteIncharge
);
router.patch("/contractor/:projectId/:taskId/task",authenticate,updateTaskByIdForContractor);
router.patch("/site-incharge/:projectId/:taskId/task",authenticate,updateTaskByIdForSiteIncharge);
router.post("/site-incharge/ass-contractor",authenticate,addContractorForSiteIncharge);
router.post("/site-incharge/assign-task-to-contractor",authenticate,assignTaskToContractor);
router.put(
  "/contractor/:projectId/:taskId/mini/task",authenticate,
  miniUpdateTaskByIdForContractor
);
router.post("/tasks/create",authenticate, createTaskForProjectUnit);
router.post("/assign-contractor",authenticate, assignContractorToUnit);


export default router;
