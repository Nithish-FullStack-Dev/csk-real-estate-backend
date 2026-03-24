// const errorHandler = (err, req, res, next) => {
//   let statusCode = err.statusCode || 500;
//   let message = err.message || "Internal Server Error";

//   // Multer errors
//   if (err.name === "MulterError") {
//     statusCode = 400;
//     message = err.message;
//   }

//   // CSRF errors
//   if (err.code === "EBADCSRFTOKEN") {
//     statusCode = 403;
//     message = "Invalid CSRF token";
//   }

//   res.status(statusCode).json({
//     success: false,
//     message,
//     errors: err.errors || [],
//   });
// };

// export default errorHandler;

import { createNotification } from "../utils/notificationHelper.js";
import User from "../modals/user.js";

const errorHandler = async (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    message = err.message;
  }

  // CSRF errors
  if (err.code === "EBADCSRFTOKEN") {
    statusCode = 403;
    message = "Invalid CSRF token";
  }

  /* =========================================================
     🔔 9.3 Errors / Monitoring
     Notify: Admin + Owner when system failures occur
  ========================================================= */

  if (statusCode >= 500) {
    try {
      const adminsOwners = await User.find({
        role: { $in: ["admin", "owner"] },
      }).select("_id");

      const receivers = adminsOwners.map((u) => u._id);

      if (receivers.length > 0) {
        await createNotification({
          userId: receivers,
          title: "System Error Detected",
          message: `A system error occurred: ${message}`,
          triggeredBy: req.user?._id || null,
          category: "system",
          priority: "P1",
          deepLink: `/system/errors`,
          entityType: "SystemError",
          entityId: null,
        });
      }
    } catch (notificationError) {
      console.error(
        "Error sending monitoring notification:",
        notificationError,
      );
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || [],
  });
};

export default errorHandler;
