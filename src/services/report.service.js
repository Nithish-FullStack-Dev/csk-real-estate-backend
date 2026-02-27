import FormData from "form-data";
import invoice from "../modals/invoice.js";
import leadModal from "../modals/leadModal.js";
import MultiTaskGroup from "../modals/MultiTaskGroup.js";
import PropertyUnit from "../modals/propertyUnit.model.js";
// import Lead from "../modals/lead.model.js";
// import Invoice from "../modals/invoice.model.js";
// import Task from "../modals/task.model.js";
import { getDateGroupStage } from "../utils/report.utils.js";
import OpenPlot from "../modals/openPlot.js";
import OpenLand from "../modals/openLand.js";
import EnquiryForm from "../modals/enquiryForm.js";
import InnerPlot from "../modals/InnerPlot.js";
import SiteVisit from "../modals/siteVisitModal.js";

import { format, addMonths, addWeeks, addDays } from "date-fns";
export const generateReport = async (type, filters) => {
  switch (type) {
    case "properties":
      return await propertiesReport(filters);

    case "agents":
      return await agentReport(filters);

    case "accounting":
      return await accountingReport(filters);

    case "contractors":
      return await contractorReport(filters);

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

/* ACCOUNTING REPORT */

const accountingReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");

  return await invoice.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: dateGroup,
        revenueTotal: { $sum: "$amount" },
        invoicesReceived: { $sum: 1 },
        invoicesApproved: {
          $sum: {
            $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        date: "$_id",
        revenueTotal: 1,
        invoicesReceived: 1,
        invoicesApproved: 1,
      },
    },
  ]);
};

/* CONTRACTOR REPORT */

const contractorReport = async ({ dateFrom, dateTo, groupBy }) => {
  const dateGroup = getDateGroupStage(groupBy, "$createdAt");

  return await MultiTaskGroup.aggregate([
    {
      $match: {
        createdAt: { $gte: dateFrom, $lte: dateTo },
      },
    },
    {
      $group: {
        _id: {
          date: dateGroup,
          contractor: "$assignedTo",
        },
        tasksCreated: { $sum: 1 },
        tasksApproved: {
          $sum: {
            $cond: [{ $eq: ["$status", "approved"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        date: "$_id.date",
        contractorId: "$_id.contractor",
        tasksCreated: 1,
        tasksApproved: 1,
      },
    },
  ]);
};
