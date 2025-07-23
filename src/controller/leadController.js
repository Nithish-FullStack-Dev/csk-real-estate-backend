import Lead from "../modals/leadModal.js";
import Property from "../modals/propertyModel.js";
import Commission from "../modals/commissionsModal.js";

export const saveLead = async (req, res) => {
  try {
    const leadData = req.body;

    if (!leadData)
      return res.status(400).json({ message: "Please provide lead data." });

    leadData.addedBy = req.user._id;

    const newLead = new Lead(leadData);
    const savedLead = await newLead.save();

    res
      .status(201)
      .json({ message: "Lead saved successfully", lead: savedLead });
  } catch (error) {
    console.error("Error saving lead:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate("property").populate("addedBy");
    res.status(200).json({ message: "Leads fetched successfully", leads });
  } catch (error) {
    console.error("Error fetching leads:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//* GET all leads added by the logged-in user (agent)
export const getLeadsByUserId = async (req, res) => {
  try {
    const userId = req.user._id; // ✅ Get from middleware

    const leads = await Lead.find({ addedBy: userId })
      .populate("property")
      .populate("addedBy");
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching leads for logged-in user",
      error: error.message,
    });
  }
};

export const updateLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const leadData = { ...req.body, lastContact: new Date() };

    const updatedLead = await Lead.findByIdAndUpdate(id, leadData, {
      new: true, // returns the updated document
      runValidators: true, // ensures schema validation
    });

    if (!updatedLead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.status(200).json({ message: "Lead updated successfully", updatedLead });
  } catch (error) {
    console.error("Error updating lead:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//* GET all available properties (you can customize filters)
export const getAvailableProperties = async (req, res) => {
  try {
    const properties = await Property.find({
      "customerInfo.propertyStatus": {
        $in: ["Available", "Upcoming", "Under Construction"],
      },
    });

    res.status(200).json({ properties });
  } catch (err) {
    console.error("Error fetching available properties:", err.message);
    res
      .status(500)
      .json({ message: "Failed to fetch properties", error: err.message });
  }
};

export const getClosedLeads = async (req, res) => {
  try {
    const commissionedLeadRecords = await Commission.find(
      {},
      "clientId"
    ).lean();

    const commissionedLeadIds = commissionedLeadRecords.map((record) =>
      record.clientId.toString()
    );

    const closedLeads = await Lead.find({
      propertyStatus: "Closed",
      _id: { $nin: commissionedLeadIds },
    })
      .populate("property")
      .populate("addedBy");

    res.status(200).json({ leads: closedLeads });
  } catch (error) {
    console.error("Error fetching closed leads:", error); // Log the full error for debugging
    res
      .status(500)
      .json({ message: "Failed to fetch closed leads", error: error.message });
  }
};
