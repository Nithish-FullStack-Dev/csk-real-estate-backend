// import asyncHandler from "../utils/asyncHandler.js";
// import { AuditLog } from "../modals/auditLog.model.js";

// export const getAuditLogs = asyncHandler(async (req, res) => {
//   const {
//     search,
//     operationType,
//     dateFrom,
//     dateTo,
//     page = 1,
//     pageSize = 20,
//   } = req.query;

//   const filter = {};

//   if (search) {
//     filter.$or = [
//       { collectionName: { $regex: search, $options: "i" } },
//       { operationType: { $regex: search, $options: "i" } },
//       { documentId: { $regex: search, $options: "i" } },
//     ];
//   }

//   if (operationType && operationType !== "all") {
//     filter.operationType = operationType;
//   }

//   if (dateFrom || dateTo) {
//     filter.createdAt = {};
//     if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
//     if (dateTo) {
//       const end = new Date(dateTo);
//       end.setHours(23, 59, 59, 999);
//       filter.createdAt.$lte = end;
//     }
//   }

//   const parsedPage = Math.max(1, parseInt(page));
//   const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize)));
//   const skip = (parsedPage - 1) * parsedPageSize;

//   const [data, total] = await Promise.all([
//     AuditLog.find(filter)
//       .populate({
//         path: "userId",
//         select: "name email",
//       })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parsedPageSize)
//       .lean(),
//     AuditLog.countDocuments(filter),
//   ]);

//   res.status(200).json({
//     data,
//     total,
//     page: parsedPage,
//     pageSize: parsedPageSize,
//   });
// });

import asyncHandler from "../utils/asyncHandler.js";
import { AuditLog } from "../modals/auditLog.model.js";
import { createNotification } from "../utils/notificationHelper.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    search,
    operationType,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 20,
  } = req.query;

  const filter = {};

  if (search) {
    filter.$or = [
      { collectionName: { $regex: search, $options: "i" } },
      { operationType: { $regex: search, $options: "i" } },
      { documentId: { $regex: search, $options: "i" } },
    ];
  }

  if (operationType && operationType !== "all") {
    filter.operationType = operationType;
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const parsedPage = Math.max(1, parseInt(page));
  const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize)));
  const skip = (parsedPage - 1) * parsedPageSize;

  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .populate({
        path: "userId",
        select: "name email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedPageSize)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  /* =========================================================
     🔔 9.4 Audit Log Access
     Notify: Owner + Admin
  ========================================================= */

  const adminsOwners = await User.find({
    role: { $in: ["admin", "owner"] },
  }).select("_id");

  const receivers = adminsOwners.map((u) => u._id);

  if (receivers.length > 0) {
    await createNotification({
      userId: receivers,
      title: "Audit Logs Accessed",
      message: `Audit logs were accessed by ${req.user?.name || "a user"}.`,
      triggeredBy: req.user?._id,
      category: "system",
      priority: "P2",
      deepLink: `/system/audit-logs`,
      entityType: "AuditLog",
      entityId: null,
    });
  }

  res.status(200).json({
    data,
    total,
    page: parsedPage,
    pageSize: parsedPageSize,
  });
});
