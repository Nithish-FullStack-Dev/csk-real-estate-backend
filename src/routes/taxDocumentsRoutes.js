import express from "express";
import { getDocuments,addDocument,updateTaxDocStatus,updateAuditStatus  } from "../controller/taxDocumentsController.js";
import { authenticate,authorizeRoles} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/",authenticate,authorizeRoles("accountant"),addDocument);
router.get("/",authenticate,authorizeRoles("accountant"),getDocuments);
router.put("/updateStatus/:docId",authenticate,authorizeRoles("accountant"), updateTaxDocStatus);
router.put("/updateAuditStatus/:docId", updateAuditStatus);


export default router;