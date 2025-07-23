// import mongoose from "mongoose";

// const cmsPropertySchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: true,
//     },
//     location: {
//       type: String,
//       required: true,
//     },
//     type: {
//       type: String,
//       enum: ["Ongoing", "Completed", "Upcoming", "Open Plots"],
//       default: "Ongoing",
//     },
//     category: {
//       type: String,
//       enum: ["Apartment", "Villa", "Plot", "Commercial", "Other"],
//       default: "Apartment",
//     },
//     price: {
//       type: String, // Use String for values like "₹45 Lakhs onwards"
//       required: true,
//     },
//     image: {
//       type: String,
//       required: true,
//     },
//     features: {
//       type: [String],
//       default: [],
//     },
//     description: {
//       type: String,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ["active", "inactive", "sold"],
//       default: "active",
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Prevent model overwrite in dev
// const cmsProperty =
//   mongoose.models.cmsProperty ||
//   mongoose.model("cmsProperty", cmsPropertySchema);

// export default cmsProperty;
