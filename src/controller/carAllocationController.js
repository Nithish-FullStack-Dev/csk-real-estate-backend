import CarAllocation from "../modals/carAllocation.js";
import User from "../modals/user.js"; // Assuming you have a User model

// ✅ Create / Save New Car Allocation
export const saveCarAllocation = async (req, res) => {
  try {
    const {
      model,
      licensePlate,
      status = "available", // Default to 'available' for new cars
      fuelLevel,
      mileage,
      lastService,
      location,
      notes,
      type, // Added type
      capacity, // Added capacity
    } = req.body;

    // Validate if license plate already exists
    const existingCar = await CarAllocation.findOne({ licensePlate });
    if (existingCar) {
      return res
        .status(409)
        .json({ message: "Car with this license plate already exists." });
    }

    // New cars should typically be 'available' and not assigned initially
    const newCar = new CarAllocation({
      model,
      licensePlate,
      status, // Should be 'available' if no assignment at creation
      fuelLevel,
      mileage,
      lastService,
      location,
      notes,
      type,
      capacity,
      assignedTo: null, // Ensure new cars are not assigned
      assignedBy: null,
      assignedAt: null,
      actualReturnAt: null,
      usageLogs: [], // Initialize explicitly if not done by schema default
    });

    await newCar.save();

    res.status(201).json({
      message: "Car allocation saved successfully",
      data: newCar,
    });
  } catch (error) {
    console.error("Error saving car allocation:", error);
    if (error.code === 11000) {
      // Duplicate key error for unique fields like licensePlate
      return res
        .status(409)
        .json({ message: "A car with this license plate already exists." });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get All Car Allocations
export const getAllCarAllocations = async (req, res) => {
  try {
    // You could add query parameters for filtering, e.g., req.query.status
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    const carAllocations = await CarAllocation.find(query)
      .populate("assignedTo.agent")
      .populate("assignedBy");

    res.status(200).json(carAllocations);
  } catch (error) {
    console.error("Error fetching all car allocations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Update Car Allocation (Unified and Robust)
export const updateCarAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      model,
      licensePlate,
      status,
      type,
      capacity,
      assignedTo, // { agent: userId, assignedUntil: Date }
      assignedBy, // Team lead ID
      assignedAt, // Timestamp of assignment
      actualReturnAt, // Timestamp of actual return (for unassign)
      fuelLevel,
      mileage,
      lastService,
      location,
      notes,
      usageLogs, // Frontend sends the full updated array
      previousAssignedAgentId, // Sent by frontend during unassignment
    } = req.body;

    const vehicle = await CarAllocation.findById(id);

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // --- Update Basic Vehicle Details ---
    vehicle.model = model;
    vehicle.licensePlate = licensePlate;
    vehicle.type = type;
    vehicle.capacity = capacity;
    vehicle.fuelLevel = fuelLevel;
    vehicle.mileage = mileage;
    vehicle.lastService = lastService;
    vehicle.location = location;
    vehicle.notes = notes;
    vehicle.status = status; // Update status based on frontend payload

    // --- Handle Assignment Logic ---
    if (status === "assigned" && assignedTo && assignedTo.agent) {
      // Validate agent existence
      const agentToAssign = await User.findById(assignedTo.agent);
      if (!agentToAssign) {
        return res.status(400).json({ message: "Assigned agent not found." });
      }

      // Check if the agent is already assigned to another vehicle (excluding the current one)
      const isAgentAlreadyAssigned = await CarAllocation.findOne({
        "assignedTo.agent": assignedTo.agent,
        _id: { $ne: id },
      });

      if (isAgentAlreadyAssigned) {
        return res
          .status(400)
          .json({ message: "Agent is already assigned to another vehicle." });
      }

      // Perform assignment
      vehicle.assignedTo = {
        agent: assignedTo.agent, // Store only ID
        assignedUntil: assignedTo.assignedUntil,
      };
      vehicle.assignedBy = assignedBy;
      vehicle.assignedAt = assignedAt || new Date(); // Use provided or current date
      vehicle.actualReturnAt = null; // Clear actualReturnAt on new assignment

      // Update usageLogs array with the new full array from frontend
      vehicle.usageLogs = usageLogs;
    } else if (status === "available" && vehicle.status === "assigned") {
      // --- Handle Unassignment ---
      // This block runs when the vehicle was previously assigned and is now becoming 'available'
      vehicle.assignedTo = null;
      vehicle.assignedBy = null;
      vehicle.assignedAt = null;
      vehicle.actualReturnAt = actualReturnAt || new Date(); // Record actual return time

      // Update the actualReturnAt of the latest relevant usage log
      if (
        vehicle.usageLogs &&
        vehicle.usageLogs.length > 0 &&
        previousAssignedAgentId
      ) {
        // Find the last log for the agent who was just unassigned, and where actualReturnAt is not yet set
        const logToUpdate = vehicle.usageLogs.findLast(
          (log) =>
            log.agent.toString() === previousAssignedAgentId &&
            !log.actualReturnAt
        );

        if (logToUpdate) {
          logToUpdate.actualReturnAt = vehicle.actualReturnAt; // Use the same actualReturnAt
          vehicle.markModified("usageLogs"); // Tell Mongoose the array element was modified
        }
      }
    }
    // If status is "maintenance" or "booked" and not "assigned", ensure assigned fields are cleared.
    // If assignedTo is explicitly null from frontend, it will correctly set it to null.
    // Otherwise, it retains its value if the status change doesn't imply unassignment.

    const updatedVehicle = await vehicle.save();

    // Populate the agent details for the response
    await updatedVehicle.populate("assignedTo.agent").populate("assignedBy");

    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("Error updating car allocation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
