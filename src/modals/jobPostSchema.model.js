import mongoose from "mongoose";

const { Schema } = mongoose;

const jobPostSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      enum: [
        "Sales",
        "Engineering",
        "Marketing",
        "HR",
        "Finance",
        "Operations",
        "Other",
      ],
      default: "Other",
      index: true,
    },
    location: {
      type: String,
      required: true,
      index: true,
    },
    workMode: {
      type: String,
      enum: ["On-site", "Remote", "Hybrid"],
      default: "On-site",
    },
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship", "Contract"],
      required: true,
      index: true,
    },
    experience: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: {
        type: String,
        default: "INR",
      },
      isConfidential: {
        type: Boolean,
        default: false,
      },
    },
    overview: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    responsibilities: {
      type: String,
    },
    requirements: {
      type: String,
    },
    benefits: {
      type: String,
    },
    openings: {
      type: Number,
      default: 1,
    },
    hiringManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    applicationType: {
      type: String,
      enum: ["internal", "external"],
      default: "internal",
    },
    applyUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
    publishedAt: Date,
    expiresAt: Date,
    applicationsCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export default mongoose.model("JobPost", jobPostSchema);
