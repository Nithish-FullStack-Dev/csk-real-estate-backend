import Contactinfo from "../modals/contactInfoModel.js";

export const getContactInfo = async (req, res) => {
  try {
    const info = await Contactinfo.findOne();
    res.json(info);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContactInfo = async (req, res) => {
  try {
    let existingDoc = await Contactinfo.findOne();

    if (!existingDoc) {
      const created = await Contactinfo.create(req.body);
      return res.status(201).json(created);
    } else {
      const updated = await Contactinfo.findByIdAndUpdate(
        existingDoc._id,
        req.body,
        { new: true }
      );
      return res.status(200).json(updated);
    }
  } catch (error) {
    console.error("Contact info update error:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
