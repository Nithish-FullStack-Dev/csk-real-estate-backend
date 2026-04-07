import { Notification } from "../modals/notification.js";
import { io, onlineUsers } from "../../server.js";

/**
 * Creates a notification in the database and sends it via socket if the user is online.
 * @param {string|string[]} userId - ID(s) of the user(s) receiving the notification
 * @param {string} title - Title of the notification
 * @param {string} message - Content of the notification
 * @param {string} triggeredBy - ID of the user who triggered the notification (optional)
 * @param {string} category - Category of notification (e.g., 'lead', 'finance')
 * @param {string} priority - Priority level ('P0', 'P1', 'P2', 'P3')
 * @param {string} deepLink - URL or route for frontend navigation
 * @param {string} entityType - Type of related entity
 * @param {string} entityId - ID of related entity
 * @returns {Promise<Object|Object[]>} The saved notification object(s)
 */
export const createNotification = async ({
  userId,
  title,
  message,
  triggeredBy = null,
  category = "system",
  priority = "P2",
  deepLink = null,
  entityType = null,
  entityId = null,
}) => {
  try {
    const userIds = Array.isArray(userId) ? userId : [userId];
    const results = [];

    for (const id of userIds) {
      const notification = new Notification({
        userId: id,
        title,
        message,
        triggeredBy,
        category,
        priority,
        deepLink,
        entityType,
        entityId,
      });

      await notification.save();

      // Emit socket event to the user
      const targetSocketId = onlineUsers.get(id.toString());
      if (targetSocketId) {
        io.to(targetSocketId).emit("newNotification", {
          notification,
        });
        // console.log(`📡 Socket notification emitted to User: ${id}`);
      } else {
        // console.log(`📴 User ${id} is offline, notification saved to DB only.`);
      }
      results.push(notification);
    }

    return Array.isArray(userId) ? results : results[0];
  } catch (error) {
    console.error("❌ Error in createNotification helper:", error);
    return null;
  }
};
