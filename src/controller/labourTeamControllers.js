import LaborTeam from "../modals/labourTeam.js"; // your all-in-one schema

export const createLaborTeam = async (req, res) => {
  try {
    const { name, supervisor, type, members, wage, project, contact, remarks } =
      req.body;

    // Validate required fields manually if needed (you can also use zod or Joi)
    if (
      !name ||
      !supervisor ||
      !type ||
      !members ||
      !wage ||
      !project ||
      !contact
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be filled" });
    }

    const newTeam = await LaborTeam.create({
      contractor: req.user._id, // automatically assigned via middleware
      name,
      supervisor,
      type,
      members,
      wage,
      project,
      contact,
      remarks,
      status: "Active",
      attendancePercentage: 0,
      attendanceRecords: [],
      wageHistory: [
        {
          wage,
          reason: "Initial wage",
        },
      ],
    });

    return res.status(201).json(newTeam);
  } catch (err) {
    console.error("Create Labor Team Error:", err);
    res.status(500).json({ message: "Server error while creating team" });
  }
};

export const getLaborTeamsForContractor = async (req, res) => {
  try {
    const teams = await LaborTeam.find({ contractor: req.user._id })
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
            select: "_id floorNumber unitType",
          },
          {
            path: "unit",
            model: "PropertyUnit",
            select: "_id plotNo propertyType",
          },
        ],
        select: "projectId floorUnit unit",
      })
      .sort({ createdAt: -1 });
    res.status(200).json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "Failed to fetch labor teams" });
  }
};

export const recordAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, present, absent } = req.body;

    const team = await LaborTeam.findById(id);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // 🔒 Validate numbers FIRST
    if (present < 0 || present > team.members) {
      return res.status(400).json({
        message: "Present count cannot exceed total members",
      });
    }

    if (present + absent !== team.members) {
      return res.status(400).json({
        message: "Invalid attendance numbers",
      });
    }

    // prevent duplicate attendance
    const existing = team.attendanceRecords.find(
      (r) => r.date.toISOString().split("T")[0] === date,
    );

    if (existing) {
      return res
        .status(400)
        .json({ message: "Attendance already recorded for this date" });
    }

    // ✅ Now it is safe to mutate
    team.attendanceRecords.push({
      date: new Date(date),
      present,
      absent,
    });

    const totalPresent = team.attendanceRecords.reduce(
      (sum, r) => sum + r.present,
      0,
    );

    const totalPossible = team.attendanceRecords.length * team.members;

    team.attendancePercentage = Math.round(
      (totalPresent / totalPossible) * 100,
    );

    await team.save();

    res.status(200).json({
      message: "Attendance recorded",
      attendancePercentage: team.attendancePercentage,
      attendanceRecords: team.attendanceRecords,
    });
  } catch (err) {
    console.error("Error recording attendance:", err);
    res.status(500).json({ message: "Failed to record attendance" });
  }
};
