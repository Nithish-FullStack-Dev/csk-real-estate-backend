import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: "password" }, // hashed password
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },
    role: { type: String, default: "" },
    specialization: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    lastLogin: { type: Date, default: Date.now },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    avatar: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/847/847969.png",
    },
    department: { type: String, default: "" },
    address: { type: String, default: "" },
    currentToken: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
