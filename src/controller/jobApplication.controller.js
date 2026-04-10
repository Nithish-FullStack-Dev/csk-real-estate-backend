import asyncHandler from "../utils/asyncHandler.js";
import JobApplication from "../modals/jobApplicationSchema.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

export const applyJob = asyncHandler(async (req, res) => {
  const { jobId, name, email, phone, coverLetter } = req.body;

  if (!jobId || !name?.trim() || !email?.trim() || !phone?.trim()) {
    throw new ApiError(400, "Required fields are missing");
  }

  // Resume (PDF)
  const resumeFile = req.files?.resume?.[0];
  if (!resumeFile) {
    throw new ApiError(400, "Resume is required");
  }

  const resumeUrl = `${req.protocol}://${req.get("host")}/api/uploads/pdfs/${resumeFile.filename}`;

  // Optional Profile Image
  const imageFile = req.files?.profileImage?.[0];

  const profileImage = imageFile
    ? `${req.protocol}://${req.get("host")}/api/uploads/images/${imageFile.filename}`
    : "";

  const application = await JobApplication.create({
    jobId,
    name,
    email,
    phone,
    coverLetter,
    resumeUrl,
    profileImage,
  });

  const createdApplication = await JobApplication.findById(
    application._id,
  ).populate("jobId");

  if (!createdApplication) {
    throw new ApiError(500, "Failed to submit application");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        createdApplication,
        "Application submitted successfully",
      ),
    );
});

export const getApplicationsForJob = asyncHandler(async (req, res) => {
  const jobApplications = await JobApplication.find().populate(
    "jobId",
    "title department",
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        jobApplications,
        "Job applications fetched successfully",
      ),
    );
});
