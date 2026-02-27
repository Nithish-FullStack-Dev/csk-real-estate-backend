import { Notification } from "../modals/notification.js";
import { io, onlineUsers } from "../../server.js";

/**
 * Creates a notification in the database and sends it via socket if the user is online.
 * @param {string} userId - ID of the user receiving the notification
 * @param {string} title - Title of the notification
 * @param {string} message - Content of the notification
 * @param {string} triggeredBy - ID of the user who triggered the notification (optional)
 * @returns {Promise<Object>} The saved notification object
 */
export const createNotification = async ({ userId, title, message, triggeredBy = null }) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      triggeredBy,
    });

    await notification.save();

    // Emit socket event to the user
    const targetSocketId = onlineUsers.get(userId.toString());
    if (targetSocketId) {
      io.to(targetSocketId).emit("newNotification", {
        notification,
      });
      console.log(`📡 Socket notification emitted to User: ${userId}`);
    } else {
      console.log(`📴 User ${userId} is offline, notification saved to DB only.`);
    }

    return notification;
  } catch (error) {
    console.error("❌ Error in createNotification helper:", error);
    // Don't throw error to avoid breaking the main request flow, just log it
    return null;
  }
};
