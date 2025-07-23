import User from "../modals/user.js";
import Role from "../modals/role.js";
import bcrypt from "bcrypt";
import csrf from "csurf";
import jwt from "jsonwebtoken";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, roleName, status, phone, avatar } = req.body;

    console.log(req.body);
    console.log("Reached create user ");
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!name || !email || !roleName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Find role by name
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

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
    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Fetch all users except the logged-in user
    const users = await User.find({ _id: { $ne: loggedInUserId } });

    res.status(200).json({ users });
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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Update lastLogin
    user.lastLogin = Date.now();
    await user.save(); // Save updated lastLogin

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 2 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error", error });
  }
};

export const updateUser = async (req, res) => {
  console.log(req.body);
  const { updatedUser } = req.body;
  console.log(updatedUser);
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
    console.log(req.body);
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
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Password reset successfully." });
    console.log("DONE");
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found." });
    }

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
    const contractors = await User.find({ role: "contractor" }).select(
      "-password"
    ); // exclude password
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
    { new: true }
  );

  res.json(issue);
};

export const getSiteIncharges = async (req, res) => {
  try {
    const siteIncharges = await User.find({ role: "site_incharge" }).select(
      "name email role"
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
      "name email role"
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
    const agent = await User.find({ role: "agent" });
    res.status(200).json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    res.status(500).json({ message: "Failed to fetch agent" });
  }
};

export const getAllCustomer_Purchased = async (req, res) => {
  try {
    const customer_purchased = await User.find({ role: "customer_purchased" });
    res.status(200).json(customer_purchased);
  } catch (error) {
    console.error("Error fetching customer_purchased:", error);
    res.status(500).json({ message: "Failed to fetch customer_purchased" });
  }
};
