import Commission from "../modals/commissionsModal.js";

//! POST /api/commissions
export const createCommission = async (req, res) => {
  try {
    const { clientId } = req.body;

    const existing = await Commission.findOne({ clientId });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Commission already exists for this lead" });
    }

    const commission = await Commission.create({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json(commission);
  } catch (error) {
    res.status(500).json({ message: "Failed to create commission", error });
  }
};

//! GET /api/commissions
export const getAllCommissions = async (req, res) => {
  try {
    const commissions = await Commission.find().populate({
      path: "clientId",
      model: "Lead",
      populate: [
        {
          path: "property",
          model: "Building",
          select: "_id projectName location propertyType",
        },
        {
          path: "floorUnit",
          model: "FloorUnit",
          select: "_id floorNumber unitType",
        },
        {
          path: "unit",
          model: "PropertyUnit",
          select: "_id plotNo propertyType totalAmount",
        },
        {
          path: "addedBy",
          model: "User",
          select: "name email role avatar",
        },
      ],
    });
    res.status(200).json(commissions);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch commissions", error });
  }
};

//! GET /api/commissions/:id
export const getCommissionById = async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id).populate({
      path: "clientId",
      model: "Lead",
      populate: [
        {
          path: "property",
          model: "Building",
          select: "_id projectName location propertyType",
        },
        {
          path: "floorUnit",
          model: "FloorUnit",
          select: "_id floorNumber unitType",
        },
        {
          path: "unit",
          model: "PropertyUnit",
          select: "_id plotNo propertyType totalAmount",
        },
        {
          path: "addedBy",
          model: "User",
        },
      ],
    });
    // const commission = await Commission.findById(req.params.id);

    if (!commission) {
      return res.status(404).json({ message: "Commission not found" });
    }

    res.status(200).json(commission);
  } catch (error) {
    res.status(500).json({ message: "Failed to get commission", error });
  }
};

//! PATCH /api/commissions/:id
export const updateCommission = async (req, res) => {
  try {
    const {
      commissionAmount,
      commissionPercent,
      saleDate,
      paymentDate,
      status,
    } = req.body;

    const updated = await Commission.findByIdAndUpdate(
      req.params.id,
      {
        commissionAmount,
        commissionPercent,
        saleDate,
        paymentDate,
        status,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Commission not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update commission", error });
  }
};

//! DELETE /api/commissions/:id
export const deleteCommission = async (req, res) => {
  try {
    const id = req.params.id;

    await Commission.findByIdAndUpdate(id, {
      deletedBy: req.user._id,
    });

    const deleted = await Commission.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Commission not found" });
    }

    res.status(200).json({ message: "Commission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete commission", error });
  }
};
