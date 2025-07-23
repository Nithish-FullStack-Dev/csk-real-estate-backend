import LaborTeam from "../modals/labourTeam.js"; // your all-in-one schema

export const createLaborTeam = async (req, res) => {
  try {
    const {
      name,
      supervisor,
      type,
      members,
      wage,
      project,
      contact,
      remarks,
    } = req.body;

    // Validate required fields manually if needed (you can also use zod or Joi)
    if (!name || !supervisor || !type || !members || !wage || !project || !contact) {
      return res.status(400).json({ message: "All required fields must be filled" });
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
    const teams = await LaborTeam.find({ contractor: req.user._id }).populate({
        path: "project",
        populate: {
          path: "projectId",
          model: "Property",
          select: "basicInfo", // ✅ Select the whole basicInfo object
        },
        select: "projectId",
      }).sort({ createdAt: -1 });
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
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Create new attendance record
    const newRecord = {
      date: new Date(date),
      present,
      absent,
    };

    team.attendanceRecords.push(newRecord);

    // Recalculate attendance percentage
    const totalPresent = team.attendanceRecords.reduce((acc, r) => acc + r.present, present);
    const totalDays = team.attendanceRecords.length + 1;
    const totalPossible = totalDays * team.members;

    const avgPercentage = Math.round((totalPresent / totalPossible) * 100);
    team.attendancePercentage = avgPercentage;

    await team.save();
    res.status(200).json({ message: "Attendance recorded", attendancePercentage: avgPercentage });
  } catch (err) {
    console.error("Error recording attendance:", err);
    res.status(500).json({ message: "Failed to record attendance" });
  }
};
