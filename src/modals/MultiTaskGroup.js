import mongoose from "mongoose";

const MultiTaskUserSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  role: String,
  department: String,
  label: String,
});

const MultiTaskGroupSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    users: [MultiTaskUserSchema],
  },
  { timestamps: true }
);

export default mongoose.model("MultiTaskGroup", MultiTaskGroupSchema);