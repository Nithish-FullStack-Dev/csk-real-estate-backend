import FormData from "form-data";
import invoice from "../modals/invoice.js";
import leadModal from "../modals/leadModal.js";
import MultiTaskGroup from "../modals/MultiTaskGroup.js";
import PropertyUnit from "../modals/propertyUnit.model.js";
import { getDateGroupStage } from "../utils/report.utils.js";
import OpenPlot from "../modals/openPlot.js";
import OpenLand from "../modals/openLand.js";
import EnquiryForm from "../modals/enquiryForm.js";
import InnerPlot from "../modals/InnerPlot.js";
import SiteVisit from "../modals/siteVisitModal.js";
import TeamAgent from "../modals/teamManagementModal.js";
import Project from "../modals/projects.js";
import Customer from "../modals/customerSchema.js";
import SiteInspection from "../modals/siteInspection.js";
import Invoice from "../modals/invoice.js";
import Budget from "../modals/budget.js";
import User from "../modals/user.js";

import { format, addMonths, addWeeks, addDays } from "date-fns";
export const generateReport = async (type, filters) => {
  switch (type) {
    case "properties":
      return await propertiesReport(filters);

    case "agents":
      return await agentReport(filters);

    case "team-leads":
      return await teamLeadReport(filters);
    case "sales-managers":
      return await salesManagerReport(filters);
    case "accounting":
      return await accountingReport(filters);

    case "contractors":
      return await contractorReport(filters);
    case "site-incharge":
      return await siteInchargeReport(filters);

    default:
      throw new Error("Invalid report type");
  }
};

const generatedates = (start, end, groupBy) => {
  const dates = [];
  let current = new Date(start);

  while (current <= end) {
    if (groupBy === "month") {
      dates.push(format(current, "yyyy-MM-DD"));
      current = addMonths(current, 1);
    } else if (groupBy === "week") {
      dates.push(format(current, "yyyy-ww-DD"));
      current = addWeeks(current, 1);
    } else {
      dates.push(format(current, "yyyy-MM-DD"));
      current = addDays(current, 1);
    }
  }

  return dates;
};
/* PROPERTIES REPORT */

export const propertiesReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");
  const buildingData = await PropertyUnit.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $lookup: {
        from: "buildings",
        localField: "buildingId",
        foreignField: "_id",
        as: "building",
      },
    },
    {
      $unwind: {
        path: "$building",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          property: "$building.projectName",
        },
        totalUnits: { $sum: 1 },
        soldUnits: {
          $sum: {
            $cond: [{ $eq: ["$status", "Sold"] }, 1, 0],
          },
        },
        revenue: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        date: "$_id.date",
        propertyName: "$_id.property",
        totalUnits: 1,
        soldUnits: 1,
        availableUnits: {
          $subtract: ["$totalUnits", "$soldUnits"],
        },
      },
    },
  ]);
  const openPlotData = await InnerPlot.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },

    {
      $lookup: {
        from: "openplots",
        localField: "openPlotId",
        foreignField: "_id",
        as: "openPlot",
      },
    },
    {
      $unwind: {
        path: "$openPlot",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: {
          date: dateGroup,
          property: "$openPlot.projectName",
        },
        totalUnits: { $sum: 1 },
        soldUnits: {
          $sum: {
            $cond: [{ $eq: ["$status", "Sold"] }, 1, 0],
          },
        },
      },
    },

    {
      $project: {
        date: "$_id.date",
        propertyName: "$_id.property",
        totalUnits: 1,
        soldUnits: 1,
        availableUnits: {
          $subtract: ["$totalUnits", "$soldUnits"],
        },
      },
    },
  ]);
  const openLandData = await OpenLand.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          property: "$projectName",
        },
        totalUnits: { $sum: 1 },
        soldUnits: {
          $sum: {
            $cond: [{ $eq: ["$landStatus", "Sold"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        date: "$_id.date",
        propertyName: "$_id.property",
        totalUnits: 1,
        soldUnits: 1,
        availableUnits: {
          $subtract: ["$totalUnits", "$soldUnits"],
        },
      },
    },
  ]);
  const enquiryData = await EnquiryForm.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          property: "$project",
        },
        enquiries: { $sum: 1 },
      },
    },
  ]);
  const combinedProperties = [
    ...buildingData,
    ...openPlotData,
    ...openLandData,
  ];
  const finalReport = combinedProperties.map((row) => {
    const enquiryMatch = enquiryData.find(
      (e) => e._id.property === row.propertyName && e._id.date === row.date,
    );

    return {
      ...row,
      enquiries: enquiryMatch ? enquiryMatch.enquiries : 0,
    };
  });

  return finalReport;
};

/* AGENT REPORT */

// report.controller.js

export const agentReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");

  const leadsAgg = await leadModal.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          agent: "$addedBy",
        },
        leadsAdded: { $sum: 1 },
        leadsClosed: {
          $sum: {
            $cond: [{ $eq: ["$propertyStatus", "Closed"] }, 1, 0],
          },
        },
        enquiries: {
          $sum: {
            $cond: [
              { $in: ["$propertyStatus", ["New", "Assigned", "Follow up"]] },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.agent",
        foreignField: "_id",
        as: "agent",
      },
    },
    { $unwind: "$agent" },
  ]);

  const visitAgg = await SiteVisit.aggregate([
    {
      $match: {
        date: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          agent: "$bookedBy",
        },
        siteBookings: {
          $sum: {
            $cond: [{ $in: ["$status", ["confirmed", "pending"]] }, 1, 0],
          },
        },
      },
    },
  ]);

  return leadsAgg.map((row) => {
    const visitMatch = visitAgg.find(
      (v) =>
        v._id.agent?.toString() === row._id.agent?.toString() &&
        v._id.date === row._id.date,
    );

    const totalLeads = row.leadsAdded;
    const closed = row.leadsClosed;

    return {
      agentId: row._id.agent,
      agentName: row.agent.name,
      period: row._id.date,
      leadsAdded: totalLeads,
      enquiries: row.enquiries,
      siteBookings: visitMatch ? visitMatch.siteBookings : 0,
      leadsClosed: closed,
      conversionRate:
        totalLeads > 0 ? Number(((closed / totalLeads) * 100).toFixed(1)) : 0,
    };
  });
};
/* TEAM LEAD REPORT */
export const teamLeadReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");

  const result = await TeamAgent.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "teamLeadId",
        foreignField: "_id",
        as: "teamLead",
      },
    },
    { $unwind: "$teamLead" },
    {
      $group: {
        _id: {
          date: dateGroup,
          teamLead: "$teamLead._id",
        },
        teamLeadName: { $first: "$teamLead.name" },
        teamMembers: { $sum: 1 },
        totalLeads: { $sum: "$performance.leads" },
        totalDeals: { $sum: "$performance.deals" },
        totalSales: { $sum: "$performance.sales" },
      },
    },
    {
      $project: {
        period: "$_id.date",
        teamLeadId: "$_id.teamLead",
        teamLeadName: 1,
        teamMembers: 1,
        totalLeads: 1,
        leadsClosed: "$totalDeals",
        totalSales: 1,
        conversionRate: {
          $cond: [
            { $gt: ["$totalLeads", 0] },
            {
              $round: [
                {
                  $multiply: [
                    {
                      $divide: [
                        { $min: ["$totalDeals", "$totalLeads"] },
                        "$totalLeads",
                      ],
                    },
                    100,
                  ],
                },
                1,
              ],
            },
            0,
          ],
        },
      },
    },
    { $sort: { period: 1 } },
  ]);

  return result;
};

/* SALES MANAGER REPORT */

export const salesManagerReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$bookingDate");

  const result = await Customer.aggregate([
    {
      $match: {
        bookingDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },

    /* =======================
       MANAGER
    ======================== */
    {
      $lookup: {
        from: "users",
        localField: "purchasedFrom",
        foreignField: "_id",
        as: "manager",
      },
    },
    { $unwind: { path: "$manager", preserveNullAndEmptyArrays: true } },

    /* =======================
       CUSTOMER USER
    ======================== */
    {
      $lookup: {
        from: "users",
        localField: "customerId",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },

    /* =======================
       BUILDING FLOW
    ======================== */
    {
      $lookup: {
        from: "buildings",
        localField: "property",
        foreignField: "_id",
        as: "property",
      },
    },
    { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "floorunits",
        localField: "floorUnit",
        foreignField: "_id",
        as: "floorUnit",
      },
    },
    { $unwind: { path: "$floorUnit", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "propertyunits",
        localField: "unit",
        foreignField: "_id",
        as: "unit",
      },
    },
    { $unwind: { path: "$unit", preserveNullAndEmptyArrays: true } },

    /* =======================
       OPEN PLOT FLOW
    ======================== */
    {
      $lookup: {
        from: "openplots",
        localField: "openPlot",
        foreignField: "_id",
        as: "openPlot",
      },
    },
    { $unwind: { path: "$openPlot", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "innerplots",
        localField: "innerPlot",
        foreignField: "_id",
        as: "innerPlot",
      },
    },
    { $unwind: { path: "$innerPlot", preserveNullAndEmptyArrays: true } },

    /* =======================
       OPEN LAND FLOW
    ======================== */
    {
      $lookup: {
        from: "openlands",
        localField: "openLand",
        foreignField: "_id",
        as: "openLand",
      },
    },
    { $unwind: { path: "$openLand", preserveNullAndEmptyArrays: true } },

    /* =======================
       NORMALIZED OUTPUT
    ======================== */
    {
      $project: {
        _id: 1,
        bookingDate: 1,
        date: dateGroup,

        managerId: "$manager._id",
        managerName: "$manager.name",

        customerName: "$customer.name",

        /* Project Name from any type */
        projectName: {
          $ifNull: [
            "$property.projectName",
            {
              $ifNull: ["$openPlot.projectName", "$openLand.projectName"],
            },
          ],
        },

        /* Unit Type from any type */
        unitType: {
          $ifNull: [
            "$floorUnit.unitType",
            {
              $ifNull: ["$innerPlot.plotType", "$openLand.landType"],
            },
          ],
        },

        /* Unit Number from any type */
        unitNo: {
          $ifNull: [
            "$unit.plotNo",
            {
              $ifNull: ["$innerPlot.plotNo", null],
            },
          ],
        },

        /* Revenue Safe Fallback */
        revenue: {
          $ifNull: [
            "$finalPrice",
            {
              $ifNull: [
                "$unit.totalAmount",
                {
                  $ifNull: ["$innerPlot.totalAmount", "$openLand.totalAmount"],
                },
              ],
            },
          ],
        },

        /* Sale Type (optional but useful) */
        saleType: {
          $switch: {
            branches: [
              {
                case: { $ne: ["$property", null] },
                then: "building",
              },
              {
                case: { $ne: ["$openPlot", null] },
                then: "openPlot",
              },
              {
                case: { $ne: ["$openLand", null] },
                then: "openLand",
              },
            ],
            default: "unknown",
          },
        },
      },
    },

    { $sort: { bookingDate: -1 } },
  ]);

  return result;
};

export const accountingReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$issueDate");

  const invoiceAgg = await Invoice.aggregate([
    {
      $match: {
        issueDate: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
        createdBy: "contractor",
      },
    },

    {
      $addFields: {
        period: dateGroup,
      },
    },

    {
      $group: {
        _id: {
          accountantId: "$approvedByAccountant",
          period: "$period",
        },

        invoicesReceived: { $sum: 1 },

        invoicesApproved: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
        },

        invoicesRejected: {
          $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
        },

        invoicesPaid: {
          $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id.accountantId",
        foreignField: "_id",
        as: "accountant",
      },
    },

    {
      $unwind: {
        path: "$accountant",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        period: "$_id.period",
        accountantId: "$_id.accountantId",
        accountantName: {
          $ifNull: ["$accountant.name", "Unassigned"],
        },
        invoicesReceived: 1,
        invoicesApproved: 1,
        invoicesRejected: 1,
        invoicesPaid: 1,
      },
    },
  ]);

  return invoiceAgg.map((row) => ({
    ...row,
    taxUploads: 0,
    taxClaims: 0,
    budgetUtilizedPercent: 0,
  }));
};

/* CONTRACTOR REPORT */

export const contractorReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");

  /* ===============================
     1️⃣ TASK AGGREGATION
  =============================== */

  const taskAgg = await Project.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },

    {
      $addFields: {
        period: dateGroup,
      },
    },

    {
      $project: {
        unitsArray: { $objectToArray: "$units" },
        period: 1,
      },
    },

    { $unwind: { path: "$unitsArray", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$unitsArray.v", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "users",
        localField: "unitsArray.v.contractor",
        foreignField: "_id",
        as: "contractor",
      },
    },
    { $unwind: { path: "$contractor", preserveNullAndEmptyArrays: true } },

    {
      $group: {
        _id: {
          contractorId: "$contractor._id",
          period: "$period",
        },

        contractorName: { $first: "$contractor.name" },

        tasksCreated: { $sum: 1 },

        tasksApproved: {
          $sum: {
            $cond: [
              { $eq: ["$unitsArray.v.statusForSiteIncharge", "approved"] },
              1,
              0,
            ],
          },
        },

        tasksRejected: {
          $sum: {
            $cond: [
              { $eq: ["$unitsArray.v.statusForSiteIncharge", "rejected"] },
              1,
              0,
            ],
          },
        },

        photoEvidenceCount: {
          $sum: {
            $size: {
              $ifNull: ["$unitsArray.v.contractorUploadedPhotos", []],
            },
          },
        },

        avgProgressPercent: {
          $avg: "$unitsArray.v.progressPercentage",
        },
      },
    },
  ]);

  /* ===============================
     2️⃣ INVOICE AGGREGATION
  =============================== */
  const invoiceDateGroup = getDateGroupStage(groupBy, "$createdAt");

  const invoiceAgg = await Invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
        createdBy: "contractor",
      },
    },
    {
      $group: {
        _id: "$user", // ❌ remove period
        invoicesCreated: { $sum: 1 },
      },
    },
  ]);
  /* ===============================
   3️⃣ MERGE BOTH RESULTS (FIXED)
=============================== */

  const invoiceMap = new Map();

  invoiceAgg.forEach((inv) => {
    invoiceMap.set(inv._id.toString(), inv.invoicesCreated);
  });

  const finalResult = taskAgg.map((row) => {
    const contractorId = row._id.contractorId?.toString();

    return {
      contractorId: row._id.contractorId,
      contractorName: row.contractorName,
      period: row._id.period,
      tasksCreated: row.tasksCreated,
      tasksApproved: row.tasksApproved,
      tasksRejected: row.tasksRejected,
      invoicesCreated: invoiceMap.get(contractorId) || 0,
      photoEvidenceCount: row.photoEvidenceCount,
      avgProgressPercent: Number((row.avgProgressPercent || 0).toFixed(1)),
    };
  });

  return finalResult.sort((a, b) => (a.period < b.period ? 1 : -1));
};

/* SITE INCHARGE REPORT */

export const siteInchargeReport = async ({ dateFrom, dateTo, groupBy }) => {
  const projectDateGroup = getDateGroupStage(groupBy, "$createdAt");
  const inspectionDateGroup = getDateGroupStage(groupBy, "$date");

  /* ===============================
     1️⃣ PROJECT + UNIT AGGREGATION
  =============================== */

  const projectAgg = await Project.aggregate([
    {
      $match: {
        siteIncharge: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "siteIncharge",
        foreignField: "_id",
        as: "siteInchargeUser",
      },
    },
    { $unwind: "$siteInchargeUser" },

    {
      $addFields: {
        period: projectDateGroup,
        unitsArray: { $objectToArray: "$units" },
      },
    },

    { $unwind: { path: "$unitsArray", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$unitsArray.v", preserveNullAndEmptyArrays: true } },

    {
      $group: {
        _id: {
          siteInchargeId: "$siteInchargeUser._id",
          period: "$period",
        },

        name: { $first: "$siteInchargeUser.name" },

        projectsActive: { $addToSet: "$_id" },

        qcTasksCreated: { $sum: 1 },

        tasksVerified: {
          $sum: {
            $cond: [
              { $eq: ["$unitsArray.v.statusForSiteIncharge", "approved"] },
              1,
              0,
            ],
          },
        },

        avgProgressPercent: {
          $avg: "$unitsArray.v.progressPercentage",
        },
      },
    },

    {
      $project: {
        siteInchargeId: "$_id.siteInchargeId",
        period: "$_id.period",
        name: 1,
        projectsActive: { $size: "$projectsActive" },
        qcTasksCreated: 1,
        tasksVerified: 1,
        avgProgressPercent: {
          $round: ["$avgProgressPercent", 1],
        },
      },
    },
  ]);

  /* ===============================
     2️⃣ INSPECTION AGGREGATION
  =============================== */

  const inspectionAgg = await SiteInspection.aggregate([
    {
      $match: {
        date: { $gte: new Date(dateFrom), $lte: new Date(dateTo) },
      },
    },
    {
      $group: {
        _id: {
          siteInchargeId: "$site_incharge",
          period: inspectionDateGroup,
        },
        inspections: {
          $sum: {
            $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
          },
        },
      },
    },
  ]);

  /* ===============================
     3️⃣ MERGE BOTH RESULTS
  =============================== */

  const finalResult = projectAgg.map((row) => {
    const inspectionMatch = inspectionAgg.find(
      (i) =>
        i._id.siteInchargeId?.toString() === row.siteInchargeId?.toString() &&
        i._id.period === row.period,
    );

    return {
      ...row,
      inspections: inspectionMatch ? inspectionMatch.inspections : 0,
    };
  });

  return finalResult.sort((a, b) => (a.period < b.period ? 1 : -1));
};
