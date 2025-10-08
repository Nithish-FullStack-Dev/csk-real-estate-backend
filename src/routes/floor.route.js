import { Router } from "express";
import { createFloor } from "../controller/floor.controller.js";

const router = Router();

router.post("/createFloor", createFloor);

export default router;
