// controller/innerPlotBulk.controller.js

import Papa from "papaparse";
// import InnerPlot from "../modals/innerPlot.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

import InnerPlot from "../modals/InnerPlot.js";
import { getNextInnerPlotNumber } from "../utils/plotSequence.js";
/* ============================================================
   BULK GENERATE INNER PLOTS
   numbering: 01,02,03...100
   inside a specific openPlotId
============================================================ */

export const generateBulkInnerPlots = asyncHandler(async (req, res) => {
  const { openPlotId, totalPlots, area, facing, plotType, status } = req.body;

  if (!openPlotId) throw new ApiError(400, "openPlotId required");
  if (!totalPlots || totalPlots <= 0)
    throw new ApiError(400, "totalPlots invalid");

  const created = [];

  for (let i = 1; i <= totalPlots; i++) {
    const plotNo = i < 10 ? `0${i}` : `${i}`;

    const exists = await InnerPlot.findOne({
      openPlotId,
      plotNo,
    });

    if (exists) continue;

    const plot = await InnerPlot.create({
      openPlotId,
      plotNo,
      area,
      facing,
      plotType,
      status,
    });

    created.push(plot);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, created, "Inner plots generated"));
});

/* ============================================================
   CSV INNER PLOT UPLOAD
   CSV columns:
   plotNo,area,facing,plotType,status
============================================================ */

export const bulkCsvInnerPlots = asyncHandler(async (req, res) => {
  const { openPlotId } = req.body;

  if (!openPlotId) {
    throw new ApiError(400, "openPlotId is required");
  }

  if (!req.file) {
    throw new ApiError(400, "CSV file is required");
  }

  const csvString = req.file.buffer.toString("utf8");

  const parsed = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data;

  if (!rows.length) {
    throw new ApiError(400, "CSV has no valid rows");
  }

  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (const row of rows) {
    try {
      const area = row.area ? Number(row.area.toString().trim()) : null;

      if (!area || isNaN(area)) {
        skipped++;
        continue;
      }

      const plotNo = await getNextInnerPlotNumber(openPlotId);

      await InnerPlot.create({
        openPlotId,
        plotNo,
        area,
        facing: row.facing?.trim(),
        plotType: row.plotType?.trim(),
        status: row.status?.trim(),
        wastageArea: row.wastageArea
          ? Number(row.wastageArea.toString().trim())
          : undefined,
        roadWidthFt: row.roadWidthFt
          ? Number(row.roadWidthFt.toString().trim())
          : undefined,
        remarks: row.remarks?.trim(),
      });

      inserted++;
    } catch (err) {
      errors.push({
        row,
        message: err.message,
      });
    }
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        total: rows.length,
        inserted,
        skipped,
        errors,
      },
      "Inner plot CSV uploaded",
    ),
  );
});
