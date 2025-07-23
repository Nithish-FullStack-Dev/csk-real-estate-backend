import Commission from "../modals/commissionsModal.js";

//! POST /api/commissions
export const createCommission = async (req, res) => {
  try {
    const commission = await Commission.create(req.body);
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
      populate: [
        {
          path: "property",
          model: "Property",
        },
        {
          path: "addedBy",
          model: "User",
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
      populate: [
        {
          path: "property",
          model: "Property",
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
    const updated = await Commission.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
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
    const deleted = await Commission.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Commission not found" });
    }

    res.status(200).json({ message: "Commission deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete commission", error });
  }
};