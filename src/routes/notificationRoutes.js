import express from "express";
import { sendNotification,
    getNotificationsByUser,
    getUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    getUnreadNotifications
} from "../controller/notificationController.js";

const router = express.Router();

router.post("/send", sendNotification);
router.get("/user/:userId", getNotificationsByUser);
router.get("/:userId/unread-count", getUnreadNotificationCount);
router.get("/:userId/unread", getUnreadNotifications);
router.put("/:id/mark-read", markNotificationAsRead);
router.put("/:userId/mark-all-read", markAllNotificationsAsRead);


export default router;
