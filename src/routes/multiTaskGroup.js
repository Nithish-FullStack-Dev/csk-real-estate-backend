import express from "express";
import MultiTaskGroup from "../modals/MultiTaskGroup.js";

const router = express.Router();

router.post("/multi-task-group", async (req, res) => {
  try {
    const { createdBy, users } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No users provided",
      });
    }

    const group = await MultiTaskGroup.create({
      createdBy,
      users,
    });
console.log(group, "heloo data");
console.log("698d64c89e0635144f5a29b4");

    return res.status(201).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("MultiTaskGroup Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create group",
    });
  }
});

router.get("/multi-task-group/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;

    const group = await MultiTaskGroup.findOne({
      "users.taskId": taskId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found for this taskId",
      });
    }

    console.log(group, "Found group data");

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("MultiTaskGroup GET Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch group",
    });
  }
});

router.put("/multi-task-group/remove-user", async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    if (!groupId || !userId) {
      return res.status(400).json({
        success: false,
        error: "groupId and userId are required",
      });
    }

    const group = await MultiTaskGroup.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // 🔥 Remove user from group.users array
    group.users = group.users.filter(
      (u) => u.userId.toString() !== userId.toString()
    );

    // 🔥 If only 1 user remains → dissolve group
    if (group.users.length <= 1) {
      await MultiTaskGroup.findByIdAndDelete(groupId);

      return res.status(200).json({
        success: true,
        message: "Group dissolved (only one user left)",
      });
    }

    await group.save();

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Remove User From Group Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to remove user from group",
    });
  }
});

// router.put("/multi-task-group/add-user", async (req, res) => {
//   try {
//     const { groupId, user } = req.body;

//     if (!groupId || !user) {
//       return res.status(400).json({
//         success: false,
//         error: "groupId and user required",
//       });
//     }

//     const group = await MultiTaskGroup.findById(groupId);
//     if (!group) {
//       return res.status(404).json({
//         success: false,
//         error: "Group not found",
//       });
//     }

//     group.users.push(user);
//     await group.save();

//     return res.status(200).json({
//       success: true,
//       group,
//     });
//   } catch (error) {
//     console.error("Add User To Group Error:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to add user",
//     });
//   }
// });

router.put("/multi-task-group/add-user", async (req, res) => {
  try {
    const { groupId, user } = req.body;

    if (!groupId || !user) {
      return res.status(400).json({
        success: false,
        error: "groupId and user required",
      });
    }

    const group = await MultiTaskGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    // 🔥 Prevent duplicate users
    const exists = group.users.some(
      (u) => u.userId.toString() === user.userId.toString()
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        error: "User already exists in group",
      });
    }

    group.users.push(user);
    await group.save();

    return res.status(200).json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Add User To Group Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to add user",
    });
  }
});

export default router;