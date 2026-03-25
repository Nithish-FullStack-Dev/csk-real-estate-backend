import CarAllocation from "../modals/carAllocation.js";
import User from "../modals/user.js"; // Assuming you have a User model
import { createNotification } from "../utils/notificationHelper.js";

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

    const userId = req.user?._id;
    const role = req.user?.role;

    // 1️⃣ Auto expire allocations
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

    // 2️⃣ Build query
    const query = {};

    // status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    // 3️⃣ role based filter
    if (role === "agent") {
      query["assignedTo.agent"] = userId;
    }

    // 4️⃣ fetch
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
// export const updateCarAllocation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       model,
//       licensePlate,
//       status,
//       type,
//       capacity,
//       assignedTo,
//       assignedBy,
//       assignedAt,
//       actualReturnAt,
//       fuelLevel,
//       mileage,
//       lastService,
//       location,
//       notes,
//       usageLogs,
//       previousAssignedAgentId,
//     } = req.body;

//     const vehicle = await CarAllocation.findById(id);
//     if (!vehicle) {
//       return res.status(404).json({ message: "Vehicle not found" });
//     }

//     vehicle.model = model;
//     vehicle.licensePlate = licensePlate;
//     vehicle.type = type;
//     vehicle.capacity = capacity;
//     vehicle.fuelLevel = fuelLevel;
//     vehicle.mileage = mileage;
//     vehicle.lastService = lastService;
//     vehicle.location = location;
//     vehicle.notes = notes;
//     vehicle.status = status;

//     if (status === "assigned" && assignedTo && assignedTo.agent) {
//       const agentToAssign = await User.findById(assignedTo.agent);
//       if (!agentToAssign) {
//         return res.status(400).json({ message: "Assigned agent not found." });
//       }
//       const isAgentAlreadyAssigned = await CarAllocation.findOne({
//         "assignedTo.agent": assignedTo.agent,
//         _id: { $ne: id },
//       });
//       if (isAgentAlreadyAssigned) {
//         return res
//           .status(400)
//           .json({ message: "Agent is already assigned to another vehicle." });
//       }
//       vehicle.assignedTo = {
//         agent: assignedTo.agent,
//         assignedUntil: assignedTo.assignedUntil,
//       };
//       vehicle.assignedBy = assignedBy;
//       vehicle.assignedAt = assignedAt || new Date();
//       vehicle.actualReturnAt = null;
//       vehicle.usageLogs = usageLogs;

//       let updatedVehicle = await vehicle.save();

//       // 🔔 Notify Agent about vehicle allocation
//       await createNotification({
//         userId: assignedTo.agent,
//         title: "Vehicle Assigned",
//         message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) has been assigned to you.`,
//         triggeredBy: req.user._id,
//         category: "vehicle",
//         priority: "P2",
//         deepLink: `/fleet/bookings/${vehicle._id}`,
//         entityType: "Vehicle",
//         entityId: vehicle._id,
//       });
//     } else if (status === "available" && vehicle.status === "assigned") {
//       vehicle.assignedTo = null;
//       vehicle.assignedBy = null;
//       vehicle.assignedAt = null;
//       vehicle.actualReturnAt = actualReturnAt || new Date();
//       if (
//         vehicle.usageLogs &&
//         vehicle.usageLogs.length > 0 &&
//         previousAssignedAgentId
//       ) {
//         const logToUpdate = vehicle.usageLogs.findLast(
//           (log) =>
//             log.agent.toString() === previousAssignedAgentId &&
//             !log.actualReturnAt,
//         );
//         if (logToUpdate) {
//           logToUpdate.actualReturnAt = vehicle.actualReturnAt;
//           vehicle.markModified("usageLogs");
//         }
//       }
//     }

//     updatedVehicle = await updatedVehicle.populate([
//       { path: "assignedTo.agent" },
//       { path: "assignedBy" },
//     ]);

//     res.status(200).json(updatedVehicle);
//   } catch (error) {
//     console.error("Error updating car allocation:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// ✅ Update Car Allocation (Unified and Robust)
// export const updateCarAllocation = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const {
//       model,
//       licensePlate,
//       status,
//       type,
//       capacity,
//       assignedTo,
//       assignedBy,
//       assignedAt,
//       actualReturnAt,
//       fuelLevel,
//       mileage,
//       lastService,
//       location,
//       notes,
//       usageLogs,
//       previousAssignedAgentId,
//     } = req.body;
// console.log("testt helikja🔥🔥🔥🔥🔥", req.body);
//     let updatedVehicle;

//     const vehicle = await CarAllocation.findById(id);
//     if (!vehicle) {
//       return res.status(404).json({ message: "Vehicle not found" });
//     }

//     // store previous assignment for comparison
//     const previousStatus = vehicle.status;
//     const previousAgent = vehicle.assignedTo?.agent;

//     vehicle.model = model;
//     vehicle.licensePlate = licensePlate;
//     vehicle.type = type;
//     vehicle.capacity = capacity;
//     vehicle.fuelLevel = fuelLevel;
//     vehicle.mileage = mileage;
//     vehicle.lastService = lastService;
//     vehicle.location = location;
//     vehicle.notes = notes;
//     vehicle.status = status;

//     if (status === "assigned" && assignedTo && assignedTo.agent) {
//       const agentToAssign = await User.findById(assignedTo.agent);
//       if (!agentToAssign) {
//         return res.status(400).json({ message: "Assigned agent not found." });
//       }

//       const isAgentAlreadyAssigned = await CarAllocation.findOne({
//         "assignedTo.agent": assignedTo.agent,
//         _id: { $ne: id },
//       });

//       if (isAgentAlreadyAssigned) {
//         return res
//           .status(400)
//           .json({ message: "Agent is already assigned to another vehicle." });
//       }

//       vehicle.assignedTo = {
//         agent: assignedTo.agent,
//         assignedUntil: assignedTo.assignedUntil,
//       };

//       vehicle.assignedBy = assignedBy;
//       vehicle.assignedAt = assignedAt || new Date();
//       vehicle.actualReturnAt = null;
//       vehicle.usageLogs = usageLogs;

//       updatedVehicle = await vehicle.save();

//       // =========================================================
//       // 🔔 4.2 VEHICLE BOOKING APPROVED
//       // Notify Requester + Team Lead + Agent
//       // =========================================================

//       const requesterId = assignedBy;

//       // Notify Agent
//       await createNotification({
//         userId: assignedTo.agent,
//         title: "Vehicle Booking Approved ag",
//         message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) has been assigned to you.`,
//         triggeredBy: req.user._id,
//         category: "vehicle",
//         priority: "P2",
//         deepLink: `/fleet/bookings/${vehicle._id}`,
//         entityType: "Vehicle",
//         entityId: vehicle._id,
//       });

//       // Notify Requester
//       if (requesterId) {
//         await createNotification({
//           userId: requesterId,
//           title: "Vehicle Booking Approved req",
//           message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) booking has been approved.`,
//           triggeredBy: req.user._id,
//           category: "vehicle",
//           priority: "P2",
//           deepLink: `/fleet/bookings/${vehicle._id}`,
//           entityType: "Vehicle",
//           entityId: vehicle._id,
//         });
//       }

//       // Notify Team Lead
//       const teamLead = await User.findOne({
//         role: "team_lead",
//         team: agentToAssign.team,
//       });

//       if (teamLead) {
//         await createNotification({
//           userId: teamLead._id,
//           title: "Vehicle Booking Approved",
//           message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) assigned to ${agentToAssign.name}.`,
//           triggeredBy: req.user._id,
//           category: "vehicle",
//           priority: "P2",
//           deepLink: `/fleet/bookings/${vehicle._id}`,
//           entityType: "Vehicle",
//           entityId: vehicle._id,
//         });
//       }
//     } else if (status === "available" && previousStatus === "assigned") {
//       vehicle.assignedTo = null;
//       vehicle.assignedBy = null;
//       vehicle.assignedAt = null;
//       vehicle.actualReturnAt = actualReturnAt || new Date();

//       if (
//         vehicle.usageLogs &&
//         vehicle.usageLogs.length > 0 &&
//         previousAssignedAgentId
//       ) {
//         const logToUpdate = vehicle.usageLogs.findLast(
//           (log) =>
//             log.agent.toString() === previousAssignedAgentId &&
//             !log.actualReturnAt,
//         );

//         if (logToUpdate) {
//           logToUpdate.actualReturnAt = vehicle.actualReturnAt;
//           vehicle.markModified("usageLogs");
//         }
//       }
//       updatedVehicle = await vehicle.save();
//     }

//     // =========================================================
//     // 🔔 4.3 VEHICLE BOOKING CHANGED
//     // Notify Requester + Agent if booking data changed
//     // =========================================================

//     if (
//       previousStatus === "assigned" &&
//       status === "assigned" &&
//       previousAgent &&
//       assignedTo?.agent &&
//       previousAgent.toString() === assignedTo.agent.toString()
//     ) {
//       const requesterId = assignedBy;

//       if (requesterId) {
//         await createNotification({
//           userId: requesterId,
//           title: "Vehicle Booking Updated",
//           message: `Vehicle booking for ${vehicle.model} (${vehicle.licensePlate}) has been updated.`,
//           triggeredBy: req.user._id,
//           category: "vehicle",
//           priority: "P2",
//           deepLink: `/fleet/bookings/${vehicle._id}`,
//           entityType: "Vehicle",
//           entityId: vehicle._id,
//         });
//       }

//       await createNotification({
//         userId: assignedTo.agent,
//         title: "Vehicle Booking Updated",
//         message: `Vehicle booking details for ${vehicle.model} (${vehicle.licensePlate}) have been updated.`,
//         triggeredBy: req.user._id,
//         category: "vehicle",
//         priority: "P2",
//         deepLink: `/fleet/bookings/${vehicle._id}`,
//         entityType: "Vehicle",
//         entityId: vehicle._id,
//       });
//     }

//     if (!updatedVehicle) {
//       updatedVehicle = await vehicle.save();
//     }

//     updatedVehicle = await updatedVehicle.populate([
//       { path: "assignedTo.agent" },
//       { path: "assignedBy" },
//     ]);

//     res.status(200).json(updatedVehicle);
//   } catch (error) {
//     console.error("Error updating car allocation:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

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

    // console.log("testt helikja🔥🔥🔥🔥🔥", req.body);

    let updatedVehicle;

    const vehicle = await CarAllocation.findById(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    /* =========================================================
       STORE PREVIOUS VALUES (IMPORTANT)
    ========================================================= */

    const previousStatus = vehicle.status;
    const previousAgent = vehicle.assignedTo?.agent;
    const previousRequester = vehicle.assignedBy;

    const previousData = {
      location: vehicle.location,
      fuelLevel: vehicle.fuelLevel,
      mileage: vehicle.mileage,
      notes: vehicle.notes,
      assignedUntil: vehicle.assignedTo?.assignedUntil?.toString(),
    };

    /* =========================================================
       UPDATE VEHICLE DATA
    ========================================================= */

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

    /* =========================================================
       4.2 VEHICLE BOOKING APPROVED
    ========================================================= */

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

      updatedVehicle = await vehicle.save();

      const requesterId = assignedBy;

      // Agent Notification
      await createNotification({
        userId: assignedTo.agent,
        title: "Vehicle Booking Approved",
        message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) has been assigned to you.`,
        triggeredBy: req.user._id,
        category: "vehicle",
        priority: "P2",
        deepLink: `/fleet/bookings/${vehicle._id}`,
        entityType: "Vehicle",
        entityId: vehicle._id,
      });

      // Requester Notification
      if (requesterId) {
        await createNotification({
          userId: requesterId,
          title: "Vehicle Booking Approved",
          message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) booking has been approved.`,
          triggeredBy: req.user._id,
          category: "vehicle",
          priority: "P2",
          deepLink: `/fleet/bookings/${vehicle._id}`,
          entityType: "Vehicle",
          entityId: vehicle._id,
        });
      }

      // Team Lead Notification
      const teamLead = await User.findOne({
        role: "team_lead",
        team: agentToAssign.team,
      });

      if (teamLead) {
        await createNotification({
          userId: teamLead._id,
          title: "Vehicle Booking Approved",
          message: `Vehicle ${vehicle.model} (${vehicle.licensePlate}) assigned to ${agentToAssign.name}.`,
          triggeredBy: req.user._id,
          category: "vehicle",
          priority: "P2",
          deepLink: `/fleet/bookings/${vehicle._id}`,
          entityType: "Vehicle",
          entityId: vehicle._id,
        });
      }
    } else if (status === "available" && previousStatus === "assigned") {

    /* =========================================================
       4.2 VEHICLE BOOKING REJECTED
    ========================================================= */
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

      updatedVehicle = await vehicle.save();

      const requesterId = previousRequester;

      if (requesterId) {
        await createNotification({
          userId: requesterId,
          title: "Vehicle Booking Rejected",
          message: `Vehicle booking for ${vehicle.model} (${vehicle.licensePlate}) has been rejected.`,
          triggeredBy: req.user._id,
          category: "vehicle",
          priority: "P2",
          deepLink: `/fleet/bookings/${vehicle._id}`,
          entityType: "Vehicle",
          entityId: vehicle._id,
        });
      }
    }

    /* =========================================================
       4.3 VEHICLE BOOKING CHANGED
       (Only when status unchanged)
    ========================================================= */

    if (previousStatus === status && status === "assigned") {
      const bookingChanged =
        previousData.location !== location ||
        previousData.fuelLevel !== fuelLevel ||
        previousData.mileage !== mileage ||
        previousData.notes !== notes ||
        (assignedTo?.assignedUntil &&
          previousData.assignedUntil !== assignedTo.assignedUntil.toString());

      if (bookingChanged) {
        const requesterId = previousRequester || assignedBy;

        if (requesterId) {
          await createNotification({
            userId: requesterId,
            title: "Vehicle Booking Updated",
            message: `Vehicle booking for ${vehicle.model} (${vehicle.licensePlate}) has been updated.`,
            triggeredBy: req.user._id,
            category: "vehicle",
            priority: "P2",
            deepLink: `/fleet/bookings/${vehicle._id}`,
            entityType: "Vehicle",
            entityId: vehicle._id,
          });
        }

        if (assignedTo?.agent) {
          await createNotification({
            userId: assignedTo.agent,
            title: "Vehicle Booking Updated",
            message: `Vehicle booking details for ${vehicle.model} (${vehicle.licensePlate}) have been updated.`,
            triggeredBy: req.user._id,
            category: "vehicle",
            priority: "P2",
            deepLink: `/fleet/bookings/${vehicle._id}`,
            entityType: "Vehicle",
            entityId: vehicle._id,
          });
        }
      }
    }

    if (!updatedVehicle) {
      updatedVehicle = await vehicle.save();
    }

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
