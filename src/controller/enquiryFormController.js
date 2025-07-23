import EnquiryForm from "../modals/enquiryForm.js";

// CREATE ENQUIRY
export const createEnquiryForm = async (req, res) => {
  try {
    const {
      propertyType,
      budget,
      name,
      email,
      phone,
      message,
      project,
      address,
    } = req.body;

    if (!propertyType || !budget || !name || !email || !phone) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newEnquiry = new EnquiryForm({
      propertyType,
      budget,
      name,
      email,
      phone,
      message,
      project,
      address,
    });

    await newEnquiry.save();
    res
      .status(201)
      .json({ message: "Enquiry submitted successfully", data: newEnquiry });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL ENQUIRIES
export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await EnquiryForm.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET SINGLE ENQUIRY BY ID
export const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await EnquiryForm.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.status(200).json(enquiry);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// UPDATE ENQUIRY
export const updateEnquiry = async (req, res) => {
  try {
    console.log("🔁 Updating Enquiry");
    console.log("➡️ Params ID:", req.params.id);
    console.log("📝 Request Body:", req.body);

    const updated = await EnquiryForm.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    res
      .status(200)
      .json({ message: "Enquiry updated", updatedEnquiry: updated });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// DELETE ENQUIRY
export const deleteEnquiry = async (req, res) => {
  try {
    const deleted = await EnquiryForm.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Enquiry not found" });
    }
    res.status(200).json({ message: "Enquiry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
