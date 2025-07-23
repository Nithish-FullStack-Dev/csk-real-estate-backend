import UserSchedule from "../modals/userSchedule.js"; // Adjust path as needed
import User from "../modals/user.js";
import mongoose from "mongoose";

export const createUserSchedule = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(req.body);
    console.log(userId);
    const {
      title,
      type,
      clientId, // Only _id of the client passed in request
      property,
      startTime,
      endTime,
      location,
      notes,
      date,
      status,
    } = req.body;

    // ✅ Validate basic required fields
    // Basic validations
    console.log("Validation Check:");
    console.log({
      userId,
      title,
      type,
      clientId,
      property,
      startTime,
      endTime,
      location,
      date,
    });

    console.log(
      "isValid(clientId):",
      mongoose.Types.ObjectId.isValid(clientId)
    );
    console.log(
      "isValid(property):",
      mongoose.Types.ObjectId.isValid(property)
    );

    if (
      !userId ||
      !title ||
      !mongoose.Types.ObjectId.isValid(clientId) ||
      !property ||
      !mongoose.Types.ObjectId.isValid(property) ||
      !startTime ||
      !endTime ||
      !location ||
      !date
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid required fields." });
    }

    // ✅ Fetch client details from DB
    const client = await User.findById(clientId).select("name avatar");

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // ✅ Build and save the schedule
    const schedule = new UserSchedule({
      user: userId,
      title,
      type,
      client: {
        _id: client._id,
        name: client.name,
        avatar:
          client.avatar ||
          "https://cdn-icons-png.flaticon.com/512/847/847969.png", // fallback
      },
      property,
      startTime,
      endTime,
      location,
      notes,
      date,
      status: status || "pending",
    });

    const saved = await schedule.save();

    res.status(201).json({
      message: "Schedule created successfully",
      schedule: saved,
    });
  } catch (err) {
    console.error("Error creating schedule:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getUserSchedules = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required in params." });
    }

    // ✅ Fetch schedules for the given user
    const schedules = await UserSchedule.find({ user: userId })
      .sort({ startTime: 1 }) // optional: sort by earliest first
      .select("-__v") // optional: exclude mongoose version key
      .populate({
        path: "property", // field in UserSchedule referencing Property
        select: "basicInfo.projectName", // only fetch projectName inside basicInfo
      });
    res.status(200).json({ schedules });
  } catch (error) {
    console.error("Error fetching user schedules:", error);
    res.status(500).json({ error: "Server error while fetching schedules" });
  }
};

export const updateSchedule = async (req, res) => {
  const scheduleId = req.params.id;
  console.log(scheduleId);
  const {
    title,
    clientId,
    propertyId,
    type,
    startTime,
    endTime,
    location,
    notes,
    date,
    status,
  } = req.body;

  // const clientId = client?._id;
  // const propertyId = property?._id;
  console.log(req.body);
  // 🔍 Validate
  if (
    !mongoose.Types.ObjectId.isValid(scheduleId) ||
    !title ||
    !type ||
    !mongoose.Types.ObjectId.isValid(clientId) ||
    !mongoose.Types.ObjectId.isValid(propertyId) ||
    !startTime ||
    !endTime ||
    !location ||
    !date
  ) {
    return res.status(400).json({ error: "Missing or invalid fields." });
  }

  try {
    const client = await User.findById(clientId).select("name avatar");

    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const updatedSchedule = await UserSchedule.findByIdAndUpdate(
      scheduleId,
      {
        title,
        client: {
          _id: client._id,
          name: client.name,
          avatar:
            client.avatar ||
            "https://cdn-icons-png.flaticon.com/512/847/847969.png", // fallback
        },
        property: propertyId,
        type,
        startTime,
        endTime,
        location,
        notes,
        date,
        status,
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ error: "Schedule not found." });
    }

    res.json({ message: "Schedule updated successfully", updatedSchedule });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
