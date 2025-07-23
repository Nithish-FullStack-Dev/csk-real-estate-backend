import Role from "../modals/role.js"; // Adjust path if needed

export const addOrUpdateRolePermissions = async (req, res) => {
  const { name, permissions } = req.body;

  if (!name || !permissions) {
    return res.status(400).json({ message: "Name and permissions are required." });
  }

  try {
    let role = await Role.findOne({ name });
    console.log(role);
    if (role) {
      // Role exists: update permissions
      role.permissions = permissions;
      await role.save();
      console.log("Saved role is like this : ",role);
      return res.status(200).json({ message: "Role permissions updated", role });
    } else {
      // Role doesn't exist: create new
      console.log("New role is like this : ",role);
      const newRole = new Role({ name, permissions });
      await newRole.save();
      return res.status(201).json({ message: "New role created", role: newRole });
    }
  } catch (error) {
    console.error("Error saving role permissions:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

export const updateRolesOFUsers = async (req, res) => {
  const { name, description, color } = req.body;

  try {
    const updatedRole = await Role.findOneAndUpdate(
      { name }, // find by name
      { $set: { description, color } }, // update these fields only
      { new: true, upsert: true, setDefaultsOnInsert: true } // upsert = insert if not found
    );
    console.log(updatedRole);
    res.status(200).json(updatedRole);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
      const roles = await Role.find(
      {
        name: { $exists: true, $ne: "" },
        description: { $exists: true, $ne: "" },
        color: { $exists: true, $ne: "" },
      },
      "name description color"
    );// fetch only needed fields
    console.log(roles);
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// controllers/roleController.js
export const clearRoleMeta = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $unset: { description: "", color: "" } },
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role meta cleared", role: updatedRole });
  } catch (error) {
    console.error("Failed to clear role meta:", error);
    res.status(500).json({ message: "Error clearing role metadata" });
  }
};

export const getRolePermissions = async (req, res) => {
  const { roleName } = req.params;
  try {
    const role = await Role.findOne(
      { name: roleName },
      "name permissions" // only return these two fields
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    res.status(500).json({ message: "Failed to fetch role permissions" });
  }
};

export const getRolesWithUserCount = async (req, res) => {
  try {
    // Step 1: Fetch all roles
    const roles = await Role.find();

    // Step 2: Count users for each roleId
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: "$roleId",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to Map for quick lookup
    const countMap = new Map(
      userCounts.map((u) => [u._id.toString(), u.count])
    );

    // Step 3: Combine roles with user count
    const rolesWithCounts = roles.map((role) => ({
      ...role.toObject(),
      users: countMap.get(role._id.toString()) || 0,
    }));

    res.json(rolesWithCounts);
    //console.log(rolesWithCounts);
  } catch (error) {
    console.error("Error fetching roles with user count", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
