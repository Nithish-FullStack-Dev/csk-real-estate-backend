// src\controller\report.controller.js
import * as reportService from "../services/report.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getReportByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { dateFrom, dateTo, groupBy } = req.query;

  const filters = {
    dateFrom: new Date(dateFrom),
    dateTo: new Date(dateTo),
    groupBy: groupBy || "month",
  };

  const data = await reportService.generateReport(type, filters);

  res.json({
    success: true,
    type,
    filters,
    data,
  });
});
export const agentPerformanceReport = async (req, res) => {
  try {
    const { dateFrom, dateTo, groupBy } = req.query;

    const report = await agentReport({
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      groupBy,
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate report" });
  }
};
