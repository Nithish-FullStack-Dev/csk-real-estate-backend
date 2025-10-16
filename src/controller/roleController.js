import Role from "../modals/role.js"; // Adjust path if needed

export const addOrUpdateRolePermissions = async (req, res) => {
  try {
    const { name, permissions, description, color } = req.body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        message: "Name and permissions are required and must be an array",
      });
    }

    // Find existing role by name
    let role = await Role.findOne({ name });

    if (role) {
      // Update existing role
      role.permissions = permissions;
      if (description) role.description = description;
      if (color) role.color = color;
      await role.save();
    } else {
      // Create new role
      role = new Role({
        name,
        description: description || "",
        color: color || "",
        permissions,
      });
      await role.save();
    }

    return res
      .status(200)
      .json({ message: "Role permissions saved successfully", role });
  } catch (error) {
    console.error("Error saving role permissions:", error);
    return res
      .status(500)
      .json({ message: "Error saving role permissions", error: error.message });
  }
};

// ✅ CREATE
export const createRole = async (req, res) => {
  try {
    const { name, description, color, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Prevent duplicate role names
    const existingRole = await Role.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    const role = new Role({ name, description, color, permissions });
    await role.save();

    res.status(201).json({ message: "Role created successfully", role });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Error creating role" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, permissions } = req.body;

    // Prevent duplicate names (excluding current role)
    if (name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: id } });
      if (existingRole) {
        return res.status(400).json({ message: "Role name already exists" });
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { $set: { name, description, color, permissions } },
      { new: true }
    );

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role updated successfully", updatedRole });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Failed to update role" });
  }
};

// ✅ DELETE
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await Role.findByIdAndDelete(id);

    if (!deletedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({ message: "Failed to delete role" });
  }
};

export const updateRolesOFUsers = async (req, res) => {
  const { name, description, color } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Role name is required." });
  }

  try {
    // Check for duplicate name
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists." });
    }

    const updatedRole = await Role.findOneAndUpdate(
      { name },
      { $set: { description, color } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return res.status(500).json({ error: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find(
      {},
      "name description color permissions"
    ).lean(); // fetch only needed fields
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

// Get role permissions by role name
export const getRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;

    if (!roleName)
      return res.status(400).json({ message: "roleName is required" });

    const role = await Role.findOne({ name: roleName });

    if (!role) return res.status(404).json({ message: "Role not found" });

    return res.status(200).json({ permissions: role.permissions });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return res.status(500).json({
      message: "Error fetching role permissions",
      error: error.message,
    });
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
  } catch (error) {
    console.error("Error fetching roles with user count", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resetRolePermissions = async (req, res) => {
  try {
    const { roleName } = req.params;

    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({
      name: role.name,
      permissions: role.permissions || [],
    });
  } catch (error) {
    console.error("Error resetting role permissions:", error);
    return res
      .status(500)
      .json({ message: "Failed to reset role permissions" });
  }
};

export const getRoleByUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "Logged in user not found" });
    }

    const role = await Role.findOne({ name: user.role }).lean();

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    return res.status(200).json({
      message: "Role fetched successfully",
      role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
