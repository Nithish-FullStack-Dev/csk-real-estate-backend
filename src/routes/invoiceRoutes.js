import express from "express";
import { createInvoice ,getCompletedTasksForContractor,getAllInvoices,markInvoiceAsPaid,verifyInvoiceByAccountant} from "../controller/invoiceController.js";
import { authenticate,authorizeRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/",authenticate,authorizeRoles("contractor","accountant"), createInvoice);
router.get("/",authenticate,authorizeRoles("contractor","accountant"), getAllInvoices);
router.get("/completed/tasks",authenticate,authorizeRoles("contractor","accountant"), getCompletedTasksForContractor);
router.put("/:id/mark-paid",authenticate,authorizeRoles("accountant"), markInvoiceAsPaid);
router.put("/:id/accountant-verify",authenticate,authorizeRoles("accountant"), verifyInvoiceByAccountant);

export default router;
