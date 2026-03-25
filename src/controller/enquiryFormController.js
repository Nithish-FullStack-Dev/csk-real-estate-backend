import EnquiryForm from "../modals/enquiryForm.js";
import User from "../modals/user.js";
import { createNotification } from "../utils/notificationHelper.js";

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

    // 🔔 Notify all Admins and Sales Managers
    const admins = await User.find({
      role: { $in: ["admin", "sales_manager"] },
    });
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        title: "New Enquiry Received",
        message: `A new enquiry has been submitted by ${name} for ${propertyType}.`,
      });
    }

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
    const enquiries = await EnquiryForm.find()
      .populate("timeline.addedBy")
      .sort({ createdAt: -1 });
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
    const id = req.params.id;

    const {
      status,
      assignedTo,
      project,
      address,
      lastContactDate,
      nextFollowUpDate,
      note,
    } = req.body;

    const enquiry = await EnquiryForm.findById(id);

    if (!enquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    if (status !== undefined) enquiry.status = status;
    if (assignedTo !== undefined) enquiry.assignedTo = assignedTo;
    if (project !== undefined) enquiry.project = project;
    if (address !== undefined) enquiry.address = address;

    if (lastContactDate !== undefined)
      enquiry.lastContactDate = lastContactDate;

    if (nextFollowUpDate !== undefined)
      enquiry.nextFollowUpDate = nextFollowUpDate;

    // ✅ add timeline note
    if (note && note.trim() !== "") {
      enquiry.timeline.push({
        note,
        addedBy: req.user?._id || null,
      });

      enquiry.status = "Follow up";
    }

    await enquiry.save();

    res.status(200).json({
      message: "Enquiry updated",
      updatedEnquiry: enquiry,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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
