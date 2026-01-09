import Appointment from "../modals/agentSchedule.js";

// Get all schedules for agent (filter by logged-in agent if needed)
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate({
        path: "lead",
        select: "name email phone property",
        populate: {
          path: "property",
          select: "projectName",
        },
      })
      .populate("agent", "name email role");

    res.status(200).json({ schedules: appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const newAppt = new Appointment(req.body);
    await newAppt.save();
    res
      .status(201)
      .json({ message: "Appointment created", appointment: newAppt });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    res
      .status(200)
      .json({ message: "Appointment updated", appointment: updated });
  } catch (error) {
    console.error("Error updating appointment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Error deleting appointment:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
