// controllers/materialController.js
import Material from "../modals/materialManagement.js";

export const getAllMaterials = async (req, res) => {
  try {
    const { _id, role } = req?.user;

    const query = {};

    if (role === "contractor") {
      query.contractor = _id;
    }

    const materials = await Material.find(query)
      .populate({
        path: "project",
        populate: [
          {
            path: "projectId",
            model: "Building",
            select: "_id projectName",
          },
          {
            path: "floorUnit",
            model: "FloorUnit",
            select: "_id floorNumber unitNumber",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo",
          },
        ],
        select: "projectId floorUnit unit",
      })
      .populate("contractor", "_id name isDeleted");
    res.status(200).json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ message: "Failed to fetch materials" });
  }
};

export const createMaterial = async (req, res) => {
  try {
    const {
      name,
      type,
      quantity,
      unit,
      supplier,
      rate,
      project,
      deliveryDate,
      poNumber,
      invoiceNumber,
      remarks,
    } = req.body;

    const contractorId = req.user?._id;
    const existingMaterial = await Material.findOne({
      poNumber,
      project,
    }).select("_id");

    if (existingMaterial) {
      return res.status(409).json({
        message: "PO Number already exists for this project",
        field: "poNumber",
      });
    }

    const material = new Material({
      name,
      type,
      quantity,
      unit,
      supplier,
      rate,
      project,
      deliveryDate,
      poNumber,
      invoiceNumber,
      remarks,
      contractor: contractorId,
      createdBy: req.user._id,
    });

    // totalCost is auto-calculated via pre-save hook
    await material.save();
    res.status(201).json({ message: "Material added", material });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "PO Number already exists for this project",
        field: "poNumber",
      });
    }

    console.error("Error creating material:", err);
    return res.status(500).json({
      message: "Failed to add material",
    });
  }
};

export const updateMaterialStatus = async (req, res) => {
  try {
    const materialId = req.params.id;
    const { status } = req.body;

    const updated = await Material.findByIdAndUpdate(
      materialId,
      { status, updatedBy: req.user._id },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.status(200).json({ message: "Status updated", material: updated });
  } catch (err) {
    console.error("Error updating material status:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      type,
      quantity,
      unit,
      supplier,
      rate,
      project,
      deliveryDate,
      poNumber,
      invoiceNumber,
      remarks,
    } = req.body;

    const existing = await Material.findOne({
      _id: { $ne: id },
      poNumber,
      project,
    });

    if (existing) {
      return res.status(409).json({
        message: "PO Number already exists for this project",
        field: "poNumber",
      });
    }

    const updated = await Material.findByIdAndUpdate(
      id,
      {
        name,
        type,
        quantity,
        unit,
        supplier,
        rate,
        project,
        deliveryDate,
        poNumber,
        invoiceNumber,
        remarks,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({
        message: "Material not found",
      });
    }

    res.status(200).json({
      message: "Material updated",
      material: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update material",
    });
  }
};
