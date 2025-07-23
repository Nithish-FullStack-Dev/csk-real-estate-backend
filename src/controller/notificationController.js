import { Notification } from "../modals/notification.js";
import { io, onlineUsers } from "../../server.js";

// Send notification to a user
export const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, triggeredBy } = req.body;

    if (!userId || !title || !message || !triggeredBy) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const notification = new Notification({
      userId,
      title,
      message,
      triggeredBy,
    });

    await notification.save();

    // 🔴 Emit socket event to the user
    const targetSocketId = onlineUsers.get(userId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("newNotification", {
        title,
        message,
        notification,
      });
    }

    res.status(201).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Server error while sending notification." });
  }
};


// Get notifications for a user
export const getNotificationsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error while fetching notifications." });
  }
};

// GET /api/notifications/:userId/unread-count
export const getUnreadNotificationCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const count = await Notification.countDocuments({ userId, isRead: false });
    console.log("Sending counts as : ",count);
    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/notifications/:userId/unread
export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    const notifications = await Notification.find({
      userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    console.log("Sending notifications as : ",notifications);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notifications/:id/mark-read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notifications/:userId/mark-all-read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.updateMany({ userId, isRead: false }, { isRead: true });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};
