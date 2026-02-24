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
    const now = new Date();

    // 1️⃣ Auto-expire allocations
    await CarAllocation.updateMany(
      {
        status: "assigned",
        "assignedTo.assignedUntil": { $lt: now },
      },
      {
        $set: {
          status: "available",
          assignedTo: {
            agent: null,
            assignedUntil: null,
          },
          assignedBy: null,
          assignedAt: null,
        },
      },
    );

    // 2️⃣ Apply optional status filter
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }

    // 3️⃣ Fetch updated data
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
      assignedTo,
      assignedBy,
      assignedAt,
      actualReturnAt,
      fuelLevel,
      mileage,
      lastService,
      location,
      notes,
      usageLogs,
      previousAssignedAgentId,
    } = req.body;

    const vehicle = await CarAllocation.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    vehicle.model = model;
    vehicle.licensePlate = licensePlate;
    vehicle.type = type;
    vehicle.capacity = capacity;
    vehicle.fuelLevel = fuelLevel;
    vehicle.mileage = mileage;
    vehicle.lastService = lastService;
    vehicle.location = location;
    vehicle.notes = notes;
    vehicle.status = status;

    if (status === "assigned" && assignedTo && assignedTo.agent) {
      const agentToAssign = await User.findById(assignedTo.agent);
      if (!agentToAssign) {
        return res.status(400).json({ message: "Assigned agent not found." });
      }
      const isAgentAlreadyAssigned = await CarAllocation.findOne({
        "assignedTo.agent": assignedTo.agent,
        _id: { $ne: id },
      });
      if (isAgentAlreadyAssigned) {
        return res
          .status(400)
          .json({ message: "Agent is already assigned to another vehicle." });
      }
      vehicle.assignedTo = {
        agent: assignedTo.agent,
        assignedUntil: assignedTo.assignedUntil,
      };
      vehicle.assignedBy = assignedBy;
      vehicle.assignedAt = assignedAt || new Date();
      vehicle.actualReturnAt = null;
      vehicle.usageLogs = usageLogs;
    } else if (status === "available" && vehicle.status === "assigned") {
      vehicle.assignedTo = null;
      vehicle.assignedBy = null;
      vehicle.assignedAt = null;
      vehicle.actualReturnAt = actualReturnAt || new Date();
      if (
        vehicle.usageLogs &&
        vehicle.usageLogs.length > 0 &&
        previousAssignedAgentId
      ) {
        const logToUpdate = vehicle.usageLogs.findLast(
          (log) =>
            log.agent.toString() === previousAssignedAgentId &&
            !log.actualReturnAt,
        );
        if (logToUpdate) {
          logToUpdate.actualReturnAt = vehicle.actualReturnAt;
          vehicle.markModified("usageLogs");
        }
      }
    }

    let updatedVehicle = await vehicle.save();
    updatedVehicle = await updatedVehicle.populate([
      { path: "assignedTo.agent" },
      { path: "assignedBy" },
    ]);

    res.status(200).json(updatedVehicle);
  } catch (error) {
    console.error("Error updating car allocation:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
