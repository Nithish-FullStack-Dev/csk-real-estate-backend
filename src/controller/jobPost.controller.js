import JobPost from "../modals/jobPostSchema.model.js";
import asynchandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const createJobPost = asynchandler(async (req, res) => {
  const {
    title,
    overview,
    description,
    location,
    department,
    jobType,
    workMode,
    experience,
    salaryRange,
    responsibilities,
    requirements,
    benefits,
    openings,
    applicationType,
    applyUrl,
    isFeatured,
    status,
    expiresAt,
  } = req.body;

  if (!title || !overview || !description || !location || !jobType) {
    throw new ApiError(400, "Required fields missing");
  }

  if (salaryRange) {
    if (
      salaryRange.min !== undefined &&
      salaryRange.max !== undefined &&
      salaryRange.min > salaryRange.max
    ) {
      throw new ApiError(400, "Invalid salary range");
    }
  }

  if (experience) {
    if (
      experience.min !== undefined &&
      experience.max !== undefined &&
      experience.min > experience.max
    ) {
      throw new ApiError(400, "Invalid experience range");
    }
  }

  const job = await JobPost.create({
    title,
    overview,
    description,
    location,
    department,
    jobType,
    workMode,
    experience,
    salaryRange,
    responsibilities,
    requirements,
    benefits,
    openings,
    applicationType,
    applyUrl,
    isFeatured: isFeatured || false,
    status: status || "draft",
    expiresAt,
    createdBy: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, job, "Job post created successfully"));
});

export const getJobPosts = asynchandler(async (req, res) => {
  const {
    search,
    location,
    jobType,
    department,
    workMode,
    minExperience,
    maxExperience,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10,
  } = req.query;

  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const filter = {};
  const andConditions = [];

  if (req.query.public === "true") {
    filter.status = "published";

    andConditions.push({
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ],
    });
  }

  if (search) {
    andConditions.push({
      $or: [
        { title: { $regex: search, $options: "i" } },
        { overview: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (location) {
    filter.location = { $regex: location, $options: "i" };
  }

  if (jobType) {
    filter.jobType = jobType;
  }

  if (department) {
    filter.department = department;
  }

  if (workMode) {
    filter.workMode = workMode;
  }

  if (minExperience || maxExperience) {
    if (minExperience) {
      filter["experience.min"] = {
        ...(filter["experience.min"] || {}),
        $gte: Number(minExperience),
      };
    }

    if (maxExperience) {
      filter["experience.max"] = {
        ...(filter["experience.max"] || {}),
        $lte: Number(maxExperience),
      };
    }
  }

  if (minSalary || maxSalary) {
    if (minSalary) {
      filter["salaryRange.min"] = {
        ...(filter["salaryRange.min"] || {}),
        $gte: Number(minSalary),
      };
    }

    if (maxSalary) {
      filter["salaryRange.max"] = {
        ...(filter["salaryRange.max"] || {}),
        $lte: Number(maxSalary),
      };
    }
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const total = await JobPost.countDocuments(filter);

  const jobs = await JobPost.find(filter)
    .sort({ isFeatured: -1, createdAt: -1 })
    .skip(skip)
    .limit(pageSize)
    .select("-__v");

  return res.status(200).json({
    success: true,
    page: pageNumber,
    limit: pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    data: jobs,
  });
});

export const updateJobPost = asynchandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job post ID");
  }

  const existingJob = await JobPost.findById(id);

  if (!existingJob) {
    throw new ApiError(404, "Job post not found");
  }

  const {
    title,
    overview,
    description,
    location,
    department,
    jobType,
    workMode,
    experience,
    salaryRange,
    responsibilities,
    requirements,
    benefits,
    openings,
    applicationType,
    applyUrl,
    isFeatured,
    status,
    expiresAt,
  } = req.body;

  if (salaryRange) {
    if (
      salaryRange.min !== undefined &&
      salaryRange.max !== undefined &&
      salaryRange.min > salaryRange.max
    ) {
      throw new ApiError(400, "Invalid salary range");
    }
  }

  if (experience) {
    if (
      experience.min !== undefined &&
      experience.max !== undefined &&
      experience.min > experience.max
    ) {
      throw new ApiError(400, "Invalid experience range");
    }
  }

  if (title !== undefined) existingJob.title = title;
  if (overview !== undefined) existingJob.overview = overview;
  if (description !== undefined) existingJob.description = description;
  if (location !== undefined) existingJob.location = location;
  if (department !== undefined) existingJob.department = department;
  if (jobType !== undefined) existingJob.jobType = jobType;
  if (workMode !== undefined) existingJob.workMode = workMode;

  if (experience) {
    existingJob.experience = {
      min: experience.min ?? existingJob.experience.min,
      max: experience.max ?? existingJob.experience.max,
    };
  }

  if (salaryRange) {
    existingJob.salaryRange = {
      min: salaryRange.min ?? existingJob.salaryRange?.min,
      max: salaryRange.max ?? existingJob.salaryRange?.max,
      currency:
        salaryRange.currency ?? existingJob.salaryRange?.currency ?? "INR",
      isConfidential:
        salaryRange.isConfidential ??
        existingJob.salaryRange?.isConfidential ??
        false,
    };
  }

  if (responsibilities !== undefined)
    existingJob.responsibilities = responsibilities;

  if (requirements !== undefined) existingJob.requirements = requirements;

  if (benefits !== undefined) existingJob.benefits = benefits;

  if (openings !== undefined) existingJob.openings = openings;
  if (applicationType !== undefined)
    existingJob.applicationType = applicationType;
  if (applyUrl !== undefined) existingJob.applyUrl = applyUrl;
  if (isFeatured !== undefined) existingJob.isFeatured = isFeatured;

  if (status !== undefined) {
    existingJob.status = status;

    if (status === "published" && !existingJob.publishedAt) {
      existingJob.publishedAt = new Date();
    }
  }

  if (expiresAt !== undefined) existingJob.expiresAt = expiresAt;

  existingJob.updatedBy = req.user?._id;

  await existingJob.save();

  return res
    .status(200)
    .json(new ApiResponse(200, existingJob, "Job post updated successfully"));
});

export const deleteJobPost = asynchandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid job post ID");
  }

  const job = await JobPost.findByIdAndDelete(id);

  if (!job) {
    throw new ApiError(404, "Job post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Job post deleted successfully"));
});
