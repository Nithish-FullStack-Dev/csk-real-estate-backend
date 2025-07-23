import mongoose from "mongoose";
import OpenPlot from "../modals/openPlot.js";

// CREATE Open Plot
export const createOpenPlot = async (req, res) => {
  try {
    const data = req.body;
    console.log("Received data for new plot:", data);

    // 1. Check if memNo already exists
    const existingPlot = await OpenPlot.findOne({ memNo: data.memNo });

    if (existingPlot) {
      console.log(`Duplicate memNo detected: ${data.memNo}`);
      return res.status(409).json({
        // 409 Conflict status code for duplicate resource
        success: false,
        message:
          "MEM No. already exists. Please provide a unique membership number.",
        // Optionally, you can send a specific error code or field name for frontend
        error: {
          field: "memNo",
          code: "DUPLICATE_MEM_NO",
        },
      });
    }

    // 2. If memNo is unique, create and save the new plot
    const newPlot = new OpenPlot(data);
    await newPlot.save();

    console.log("New plot created successfully:", newPlot);
    res.status(201).json({ success: true, plot: newPlot });
  } catch (error) {
    console.error("Error creating open plot:", error);

    // Mongoose unique index error (E11000) will also be caught here
    // This is a fallback in case the explicit findOne check is somehow bypassed
    if (error.code === 11000) {
      // Check if the duplicate error is specifically for the 'memNo' field
      if (error.keyPattern && error.keyPattern.memNo) {
        return res.status(409).json({
          success: false,
          message:
            "MEM No. already exists. Please provide a unique membership number.",
          error: {
            field: "memNo",
            code: "DUPLICATE_MEM_NO_DB", // Indicate it came from DB unique index
          },
        });
      }
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error,
    });
  }
};

// FETCH all Open Plots
export const getAllOpenPlot = async (req, res) => {
  try {
    const plots = await OpenPlot.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, plots });
  } catch (error) {
    console.error("Error fetching open plots:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error,
    });
  }
};

export const getOpenPlotById = async (req, res) => {
  try {
    const { id } = req.params;
    const openPlot = await OpenPlot.findById(id);
    if (!openPlot) {
      return res.status(404).json({ message: "open plot not found" });
    }
    res.status(200).json(openPlot);
  } catch (error) {
    console.error("Error fetching open plots:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error,
    });
  }
};

// DELETE Open Plot by ID
export const deleteOpenPlotById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid plot ID",
    });
  }

  try {
    const plot = await OpenPlot.findByIdAndDelete(id);
    if (!plot) {
      return res
        .status(404)
        .json({ success: false, message: "Plot not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Plot deleted successfully" });
  } catch (error) {
    console.error("Error deleting plot:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message || error,
    });
  }
};

// UPDATE Open Plot by ID
export const updateOpenPlot = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Open Plot ID" });
  }

  try {
    const updatedPlot = await OpenPlot.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!updatedPlot) {
      return res.status(404).json({ message: "Open Plot not found" });
    }

    res.status(200).json(updatedPlot);
    console.log("Updated Open Plot:", updatedPlot);
  } catch (error) {
    console.error("Error updating Open Plot:", error);
    res.status(500).json({
      message: "Failed to update Open Plot",
      error: error.message,
    });
  }
};
