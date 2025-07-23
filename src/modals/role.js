import mongoose from "mongoose";

const rolePermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String }, 
  color: { type: String },  
  permissions: [
    {
      module: String,
      submodule: String,
      actions: {
        read: Boolean,
        write: Boolean,
        edit: Boolean,
        delete: Boolean,
        view_only: Boolean,
      },
    },
  ],
});

const rolePermissions = mongoose.model("role",rolePermissionSchema);

export default rolePermissions;
