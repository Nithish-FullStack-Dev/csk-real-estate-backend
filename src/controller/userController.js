import User from "../modals/user.js";
import Role from "../modals/role.js";
import bcrypt from "bcrypt";
import Customer from "../modals/customerSchema.js";
import jwt from "jsonwebtoken";
import { createNotification } from "../utils/notificationHelper.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, roleName, status, phone, avatar } = req.body;

    if (!name || !email || !roleName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isDeleted) {
        return res.status(409).json({ message: "User already exists" });
      }
      return res.status(409).json({
        message: "User was previously deleted. You can restore this user.",
      });
    }

    // Find role by name
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword, // NOTE: hash in production
      roleId: role._id,
      role: roleName,
      status: status || "active",
      phone,
      lastLogin: Date.now(),
      avatar,
    });

    await newUser.save();

    // 🔔 Notify Admin + Owner about new user creation
    const admins = await User.find({
      role: { $in: ["admin", "owner"] },
    }).select("_id");
    await createNotification({
      userId: admins.map((u) => u._id),
      title: "New User Created",
      message: `A new user ${name} (${roleName}) has been created.`,
      triggeredBy: req.user?._id || newUser._id,
      category: "system",
      priority: "P2",
      deepLink: `/admin/users/${newUser._id}`,
      entityType: "User",
      entityId: newUser._id,
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({ _id: { $ne: loggedInUserId } }).select(
      "_id name email role avatar status lastLogin phone",
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllExistingUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const users = await User.find({
      _id: { $ne: loggedInUserId },
      isDeleted: false,
    }).select("_id name email role avatar status lastLogin phone");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getLoggedInUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) res.status(404).json({ message: "logged in user not found" });
    const { password, ...safeUser } = user.toObject();

    return res.status(200).json(safeUser);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserWithRole = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate("roleId");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate new token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    user.lastLogin = Date.now();
    await user.save();

    // res.cookie("token", token, {
    //  httpOnly: true,
    //  secure: process.env.NODE_ENV === "production",
    //   sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    //   path: "/",
    //  });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: "lax", // best default
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error", error });
  }
};

export const updateUser = async (req, res) => {
  const { updatedUser } = req.body;
  try {
    const result = await User.findByIdAndUpdate(updatedUser._id, updatedUser, {
      new: true,
      runValidators: true,
    });

    if (!result) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Server error while updating user." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password too short." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.status(400).json({ message: "User id not found." });
    }

    if (req.user._id.toString() === userId) {
      return res.status(400).json({ message: "You cannot delete yourself." });
    }

    const deletedUser = await User.findByIdAndUpdate(
      userId,
      {
        isDeleted: true,
        deletedBy: req.user?._id,
        status: "inactive",
      },
      { new: true },
    );

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    // 🔔 Notify Admin + Owner about user deletion
    const admins = await User.find({
      role: { $in: ["admin", "owner"] },
    }).select("_id");
    await createNotification({
      userId: admins.map((u) => u._id),
      title: "User Deleted",
      message: `User ${deletedUser.name} has been deleted from the system.`,
      triggeredBy: req.user?._id,
      category: "system",
      priority: "P1",
      deepLink: "/admin/users",
    });

    res.status(200).json({
      message: "User deleted successfully.",
      user: deletedUser, // optional: return the deleted user's data
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error while deleting user." });
  }
};

export const getAllContractors = async (req, res) => {
  try {
    const contractors = await User.find({
      role: "contractor",
      isDeleted: false,
    }).select("-password"); // exclude password
    res.status(200).json({ success: true, data: contractors });
  } catch (error) {
    console.error("Error fetching contractors:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ["active", "inactive"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const issue = await User.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true },
  );

  if (!issue) {
    return res.status(404).json({ message: "User not found or deleted" });
  }

  res.json(issue);
};

export const getSiteIncharges = async (req, res) => {
  try {
    const siteIncharges = await User.find({ role: "site_incharge" }).select(
      "name email role",
    );
    res.status(200).json(siteIncharges);
  } catch (error) {
    console.error("Error fetching site incharges:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getContractors = async (req, res) => {
  try {
    const contractors = await User.find({ role: "contractor" }).select(
      "name email role",
    );
    res.status(200).json(contractors);
  } catch (error) {
    console.error("Error fetching site incharges:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllSalesPersons = async (req, res) => {
  try {
    const salesManagers = await User.find({ role: "sales_manager" });
    res.status(200).json(salesManagers);
  } catch (error) {
    console.error("Error fetching sales managers:", error);
    res.status(500).json({ message: "Failed to fetch sales managers" });
  }
};

export const getAllAgentPersons = async (req, res) => {
  try {
    const agent = await User.find({ role: "agent" }).select("name email role");
    res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({ message: "Failed to fetch agent" });
  }
};

export const getAllCustomer_Purchased = async (req, res) => {
  try {
    const assignedCustomers = await Customer.distinct("customerId");
    const customer_purchased = await User.find({
      role: "customer_purchased",
      _id: { $nin: assignedCustomers },
    });
    res.status(200).json(customer_purchased);
  } catch (error) {
    console.error("Error fetching customer_purchased:", error);
    res.status(500).json({ message: "Failed to fetch customer_purchased" });
  }
};

export const getDeletedUsers = async (req, res) => {
  try {
    const deletedUsers = await User.find({ isDeleted: true })
      .select("_id name email role status deletedBy updatedAt")
      .populate("deletedBy", "name email"); // optional

    res.status(200).json({ users: deletedUsers });
  } catch (error) {
    console.error("Error fetching deleted users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const restoreuser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "id is required" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false, status: "active", deletedBy: null },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found or already active",
      });
    }

    return res.status(200).json({
      message: "User restored successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching deleted users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
