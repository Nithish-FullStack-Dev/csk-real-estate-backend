import OpenPlot from "../modals/openPlot.js";
import InnerPlot from "../modals/InnerPlot.js";

/* -------- OPEN PLOT SEQUENCE -------- */

export const getNextPlotNumber = async (projectName) => {
  const lastPlot = await OpenPlot.find({ projectName })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!lastPlot.length) return "01";

  const lastNo = lastPlot[0].openPlotNo;
  const numeric = parseInt(lastNo, 10);

  if (Number.isNaN(numeric)) return "01";

  const next = numeric + 1;

  return next < 10 ? `0${next}` : `${next}`;
};

/* -------- INNER PLOT SEQUENCE -------- */

export const getNextInnerPlotNumber = async (openPlotId) => {
  const lastPlot = await InnerPlot.find({ openPlotId })
    .sort({ createdAt: -1 })
    .limit(1);

  if (!lastPlot.length) return "01";

  const lastNo = lastPlot[0].plotNo;
  const numeric = parseInt(lastNo, 10);

  if (Number.isNaN(numeric)) return "01";

  const next = numeric + 1;

  return next < 10 ? `0${next}` : `${next}`;
};
