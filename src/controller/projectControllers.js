import Project from "../modals/projects.js";
import User from "../modals/user.js";
import rolePermissions from "../modals/role.js";
import mongoose from "mongoose";
import QualityIssue from "../modals/qualityIssue.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import e from "express";

export const getUserProjects = async (req, res) => {
  try {
    const { _id, role } = req.user;

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID." });
    }

    let query = {};
    if (role === "site_incharge") {
      query.siteIncharge = _id;
    } else if (role === "contractor") {
      query.contractors = _id;
    } else if (["accountant", "owner", "admin"].includes(role)) {
      query = {};
    } else {
      return res.status(400).json({ error: "Unsupported role." });
    }

    const projects = await Project.find(query)
      .populate("projectId", "_id projectName")
      .populate("floorUnit", "_id floorNumber unitType")
      .populate("unit", "_id propertyType plotNo")
      .populate("contractors", "_id name email")
      .populate("siteIncharge", "_id name email");

    return res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching project data:", error);
    return res
      .status(500)
      .json({ error: "Server error fetching project details." });
  }
};

export const createProject = async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res
      .status(201)
      .json({ message: "Project created successfully", project: newProject });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
};

export const getUserTasks = async (req, res) => {
  try {
    const { role, _id } = req.user;

    const priorityOrder = {
      high: 3,
      medium: 2,
      low: 1,
      unspecified: 0,
    };

    if (!["site_incharge", "contractor", "owner", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    let query = {};
    if (role === "site_incharge") {
      query.siteIncharge = _id;
    } else if (role === "contractor") {
      query.contractors = _id;
    }

    const projects = await Project.find(query)
      .populate("projectId", "_id projectName")
      .populate("floorUnit", "_id floorNumber unitType")
      .populate("unit", "_id propertyType plotNo")
      .populate("contractors", "_id name")
      .lean();

    const taskList = [];

    for (const project of projects) {
      const projectName = project.projectId?.projectName || "Unnamed Project";

      const contractorMap = Array.isArray(project.contractors)
        ? project.contractors.reduce((acc, c) => {
            acc[c._id?.toString()] = c.name;
            return acc;
          }, {})
        : {};

      const unitsMap = project.units || {};
      const floorNumber = project.floorUnit.floorNumber;
      const unitType = project.floorUnit.unitType;

      for (const [unitName, tasks] of Object.entries(unitsMap)) {
        for (const task of tasks) {
          const taskContractorId = task.contractor?.toString();

          if (role === "site_incharge") {
            if (
              task.isApprovedByContractor &&
              task.statusForContractor === "completed"
            ) {
              taskList.push({
                taskTitle: task.title || "Untitled Task",
                projectName,
                floorNumber,
                unitType,
                unit: unitName,
                contractorName:
                  contractorMap[taskContractorId] || "Unknown Contractor",
                submittedByContractorOn: task.submittedByContractorOn || null,
                status: task.statusForSiteIncharge || "pending verification",
                priority: task.priority || "unspecified",
                contractorUploadedPhotos: task.contractorUploadedPhotos || [],
                projectId: project._id,
                contractorId: task.contractor,
                _id: task._id,
                constructionPhase: task.constructionPhase,
                submittedBySiteInchargeOn:
                  task.submittedBySiteInchargeOn || null,
              });
            }
          } else if (role === "contractor") {
            if (taskContractorId === _id.toString()) {
              taskList.push({
                taskTitle: task.title || "Untitled Task",
                projectName,
                unit: unitName,
                constructionPhase: task.constructionPhase,
                status: task.statusForContractor || "In progress",
                deadline: task.deadline,
                progress: task.progressPercentage,
                priority: task.priority || "unspecified",
                contractorUploadedPhotos: task.contractorUploadedPhotos || [],
                projectId: project._id,
                contractorId: task.contractor,
                _id: task._id,
              });
            }
          } else if (["owner", "admin"].includes(role)) {
            taskList.push({
              taskTitle: task.title || "Untitled Task",
              projectName,
              unit: unitName,
              constructionPhase: task.constructionPhase,
              status: task.statusForContractor || "In progress",
              deadline: task.deadline,
              progress: task.progressPercentage,
              priority: task.priority || "unspecified",
              contractorUploadedPhotos: task.contractorUploadedPhotos || [],
              projectId: project._id,
              contractorId: task.contractor,
              contractorName:
                contractorMap[taskContractorId] || "Unknown Contractor",
              _id: task._id,
            });
          }
        }
      }
    }

    // Sort by priority
    taskList.sort((a, b) => {
      const aPriority =
        priorityOrder[(a.priority || "unspecified").toLowerCase()] || 0;
      const bPriority =
        priorityOrder[(b.priority || "unspecified").toLowerCase()] || 0;
      return bPriority - aPriority; // high first
    });

    res.status(200).json(taskList);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Server error fetching tasks" });
  }
};

export const getContractorsForSiteIncharge = async (req, res) => {
  try {
    const { role, _id } = req.user;

    if (role !== "site_incharge") {
      return res
        .status(403)
        .json({ error: "Access denied. Only site incharges allowed." });
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return res.status(400).json({ error: "Invalid Site Incharge ID" });
    }

    // Fetch all projects for this site incharge
    const projects = await Project.find({ siteIncharge: _id })
      .populate("projectId", "_id projectName")
      .populate("floorUnit", "_id floorNumber unitType")
      .populate("unit", "_id propertyType plotNo")
      .populate(
        "contractors",
        "_id name email phone status company specialization"
      )
      .lean();

    const contractorMap = new Map();

    for (const project of projects) {
      const projectName = project.projectId?.projectName || "Unnamed Project";
      const floorNumber = project.floorUnit?.floorNumber;
      const unitType = project.floorUnit?.unitType;
      const units = project.units || {};

      for (const contractor of project.contractors || []) {
        const contractorId = contractor._id.toString();

        // Initialize contractor if not seen
        if (!contractorMap.has(contractorId)) {
          contractorMap.set(contractorId, {
            _id: contractor._id,
            name: contractor.name,
            company: contractor.company || "N/A",
            specialization: contractor.specialization || "General",
            contactPerson: contractor.name,
            phone: contractor.phone || "N/A",
            email: contractor.email || "N/A",
            status: contractor.status || "active",
            projects: new Set(),
            totalTasks: 0,
            completedTasks: 0,
            projectDetails: [],
          });
        }

        const contractorStats = contractorMap.get(contractorId);
        contractorStats.projects.add(projectName);

        // Analyze tasks per unit
        for (const [unitName, taskArray] of Object.entries(units)) {
          for (const task of taskArray) {
            if (task.contractor?.toString() === contractorId) {
              contractorStats.totalTasks++;
              if (task.status === "approved") {
                contractorStats.completedTasks++;
              }

              // Push task details for UI (optional)
              contractorStats.projectDetails.push({
                projectName,
                unit: unitName,
                floorNumber,
                unitType,
                taskTitle: task.title || "Untitled Task",
                status: task.status,
                priority: task.priority || "unspecified",
              });
            }
          }
        }
      }
    }

    // Finalize contractor data
    const finalContractors = Array.from(contractorMap.values()).map(
      (contractor) => ({
        ...contractor,
        projects: Array.from(contractor.projects),
        completionRate:
          contractor.totalTasks > 0
            ? (
                (contractor.completedTasks / contractor.totalTasks) *
                100
              ).toFixed(1)
            : "0.0",
      })
    );

    // Sort contractors by completion rate (optional)
    finalContractors.sort((a, b) => b.completedTasks - a.completedTasks);

    res.status(200).json(finalContractors);
  } catch (error) {
    console.error("Error fetching contractors for site incharge:", error);
    res.status(500).json({ error: "Server error fetching contractors" });
  }
};

export const updateTask = async (req, res) => {
  try {
    res.status(200).json({ res: req.body });
  } catch (err) {
    res.send(err);
  }
};

export const getContractorTasksUnderSiteIncharge = async (req, res) => {
  try {
    const siteInchargeId = req.user._id;
    const contractorId = req.params.contractorId;

    if (
      !mongoose.Types.ObjectId.isValid(siteInchargeId) ||
      !mongoose.Types.ObjectId.isValid(contractorId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid Site Incharge or Contractor ID" });
    }

    // Find all projects assigned to both this site incharge and the contractor
    const projects = await Project.find({
      siteIncharge: siteInchargeId,
      contractors: contractorId,
    })
      .populate("projectId", "_id projectName")
      .populate("floorUnit", "_id floorNumber unitType")
      .populate("unit", "_id propertyType plotNo")
      .populate("contractors", "_id name email phone company specialization")
      .lean();

    const contractorTasks = [];

    for (const project of projects) {
      const projectName = project.projectId?.projectName || "Unnamed Project";
      const floorNumber = project.floorUnit?.floorNumber;
      const unitType = project.floorUnit?.unitType;
      const units = project.units || {};

      // Loop through units and gather tasks
      for (const [unitName, taskArray] of Object.entries(units)) {
        for (const task of taskArray) {
          if (task.contractor?.toString() === contractorId) {
            contractorTasks.push({
              _id: task._id,
              taskTitle: task.title || "Untitled Task",
              description: task.description || "",
              projectId: project._id,
              projectName,
              floorNumber,
              unitType,
              unit: unitName,
              constructionPhase: task.constructionPhase,
              status: task.status,
              priority: task.priority || "unspecified",
              progressPercentage: task.progressPercentage || 0,
              deadline: task.deadline,
              submittedByContractorOn: task.submittedByContractorOn || null,
              submittedBySiteInchargeOn: task.submittedBySiteInchargeOn || null,
              contractorUploadedPhotos: task.contractorUploadedPhotos || [],
            });
          }
        }
      }
    }

    // Sort tasks by priority (high → low → medium → low → unspecified)
    const priorityOrder = { high: 3, medium: 2, low: 1, unspecified: 0 };
    contractorTasks.sort((a, b) => {
      const aPriority =
        priorityOrder[(a.priority || "unspecified").toLowerCase()] || 0;
      const bPriority =
        priorityOrder[(b.priority || "unspecified").toLowerCase()] || 0;
      return bPriority - aPriority;
    });

    res.status(200).json({ tasks: contractorTasks });
  } catch (error) {
    console.error(
      "Error fetching contractor tasks under site incharge:",
      error
    );
    res
      .status(500)
      .json({ message: "Server error fetching contractor tasks", error });
  }
};

export const updateTaskByIdForContractor = async (req, res) => {
  try {
    const { taskId, projectId } = req.params;
    const newTask = req.body;
    const { shouldSubmit } = req.body;
    const { role } = req.user;

    if (
      !mongoose.Types.ObjectId.isValid(taskId) ||
      !mongoose.Types.ObjectId.isValid(projectId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    let taskFound = false;

    for (const [unitName, taskArray] of project.units.entries()) {
      const task = taskArray.find((t) => t._id.toString() === taskId);

      if (task) {
        // Update fields
        if (Array.isArray(newTask.photos)) {
          task.contractorUploadedPhotos.push(...newTask.photos);
        }

        if (newTask.evidenceTitleByContractor)
          task.evidenceTitleByContractor = newTask.evidenceTitleByContractor;

        if (newTask.status && role) {
          if (role === "site_inchage")
            task.statusForSiteIncharge = newTask.status;
          else if (role === "contractor")
            task.statusForContractor = newTask.status;
        }

        if (typeof newTask.progressPercentage === "number")
          task.progressPercentage = newTask.progressPercentage;

        if (newTask.constructionPhase)
          task.constructionPhase = newTask.constructionPhase;

        if (shouldSubmit) {
          task.submittedByContractorOn = new Date();
          task.isApprovedByContractor = true;
        }

        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found in any unit" });
    }

    await project.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const miniUpdateTaskByIdForContractor = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { phase, progress, status } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project or task ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    let taskFound = false;

    for (const [unitName, tasks] of project.units.entries()) {
      const task = tasks.find((t) => t._id.toString() === taskId);
      if (task) {
        if (phase) task.constructionPhase = phase;
        if (typeof progress === "number") task.progressPercentage = progress;
        if (status) task.statusForContractor = status;
        if (progress === 100 || status === "completed") {
          task.isApprovedByContractor = true;
        }

        taskFound = true;
        break;
      }
    }

    if (!taskFound) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found in project" });
    }

    await project.save();

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (err) {
    console.error("Contractor task update failed:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateTaskByIdForSiteIncharge = async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const {
      noteBySiteIncharge,
      qualityAssessment,
      verificationDecision,
      photos,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(taskId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project or task ID" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    let taskUpdated = false;

    for (const [unitName, taskArray] of project.units.entries()) {
      const task = taskArray.find((t) => t._id.toString() === taskId);
      if (task) {
        // Append site incharge photos
        if (Array.isArray(photos)) {
          task.siteInchargeUploadedPhotos.push(...photos);
        }

        if (noteBySiteIncharge) task.noteBySiteIncharge = noteBySiteIncharge;
        if (qualityAssessment) task.qualityAssessment = qualityAssessment;
        if (verificationDecision) {
          task.verificationDecision = verificationDecision;
          task.statusForSiteIncharge = verificationDecision;
        }

        // If verification status is approved
        if (verificationDecision?.toLowerCase() === "approved") {
          task.isApprovedBySiteManager = true;
        }

        task.submittedBySiteInchargeOn = new Date();

        console.log(task);

        taskUpdated = true;
        break;
      }
    }

    if (!taskUpdated) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found in any unit" });
    }

    await project.save();
    return res.status(200).json({
      success: true,
      message: "Task updated successfully by Site Incharge",
    });
  } catch (err) {
    console.error("Error updating task by site incharge:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addContractorForSiteIncharge = async (req, res) => {
  try {
    const {
      name,
      company,
      specialization,
      phone,
      email,
      status,
      project, // project _id
      taskTitle,
      unit, // unit name, e.g., "Block-A"
      deadline, // make sure to send this from frontend
      priority, // optional task priority
    } = req.body;

    // 1. Check if contractor exists
    let contractor = await User.findOne({ email, role: "contractor" });

    // 2. Create if not exists
    if (!contractor) {
      // 1. Fetch the roleId from rolePermissions schema
      const contractorRole = await rolePermissions.findOne({
        name: "contractor",
      });

      if (!contractorRole) {
        return res
          .status(400)
          .json({ message: "Contractor role not found in rolePermissions" });
      }

      // 2. Create the new contractor user with roleId
      contractor = new User({
        name,
        email,
        phone,
        company,
        specialization,
        role: "contractor",
        roleId: contractorRole._id, // 👈 set the roleId
        status,
      });

      await contractor.save();
    }

    // 3. Find the project
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 4. Append contractor._id to project.contractors if not already present
    if (!projectDoc.contractors.includes(contractor._id)) {
      projectDoc.contractors.push(contractor._id);
    }

    // 5. Create the task
    const newTask = {
      contractor: contractor._id,
      title: taskTitle,
      statusForContractor: "In progress",
      statusForSiteIncharge: "pending verification",
      deadline: deadline ? new Date(deadline) : new Date(), // default to now if not provided
      progressPercentage: 0,
      priority: priority || "normal",
    };

    // 6. Add task to the correct unit
    if (!projectDoc.units.has(unit)) {
      projectDoc.units.set(unit, []);
    }

    const unitTasks = projectDoc.units.get(unit);
    unitTasks.push(newTask);
    projectDoc.units.set(unit, unitTasks);

    // 7. Save the updated project
    await projectDoc.save();

    console.log("CONTRACTOR ASSIGNED");

    return res.status(201).json({
      message: "Contractor assigned and task added successfully",
      contractor,
      task: newTask,
    });
  } catch (err) {
    console.error("Assign Contractor Error:", err);
    return res
      .status(500)
      .json({ message: "Server Error", error: err.message });
  }
};

export const assignTaskToContractor = async (req, res) => {
  try {
    const {
      title,
      contractorId,
      projectId,
      unit,
      priority,
      deadline,
      phase,
      qualityIssueId,
      description,
    } = req.body;
    console.log(unit);

    // 1. Validate contractor and project
    const contractor = await User.findById(contractorId);
    if (!contractor) {
      return res.status(404).json({ message: "Contractor not found" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 2. Create the new task object
    const newTask = {
      contractor: contractor._id,
      title,
      priority,
      deadline,
      constructionPhase: phase,
      description,
      statusForContractor: "In progress",
      statusForSiteIncharge: "pending verification",
      progressPercentage: 0,
    };

    // 3. Add contractor to project if not already added
    if (!project.contractors.includes(contractor._id)) {
      project.contractors.push(contractor._id);
    }

    // 4. Add task to the correct unit
    if (!project.units.has(unit)) {
      project.units.set(unit, []);
    }

    const tasks = project.units.get(unit);
    tasks.push(newTask);
    project.units.set(unit, tasks);
    console.log(project);
    // 5. Save the project
    await project.save();

    // 6. Update the contractor in the quality issue
    await QualityIssue.findByIdAndUpdate(qualityIssueId, {
      contractor: contractor._id,
    });

    return res.status(200).json({
      message: "Task assigned and contractor updated in quality issue",
    });
  } catch (error) {
    console.error("Assignment error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createTaskForProjectUnit = async (req, res) => {
  try {
    const { title, description, projectId, unit, phase, priority, deadline } =
      req.body;

    if (!title || !description || !projectId || !unit || !phase || !deadline) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid projectId" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    const newTask = {
      title,
      description,
      contractor: req.user?._id, // assuming auth middleware injects user
      deadline: new Date(deadline),
      constructionPhase: phase,
      priority,
    };

    // Initialize unit if not present
    if (!project.units.has(unit)) {
      project.units.set(unit, []);
    }

    const taskArray = project.units.get(unit);
    taskArray.push(newTask);

    project.units.set(unit, taskArray);

    await project.save();

    return res
      .status(201)
      .json({ success: true, message: "Task created successfully" });
  } catch (error) {
    console.error("Error creating task:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const assignContractorToUnit = async (req, res) => {
  try {
    console.log(req.body);
    const { projectId, unit, contractorId } = req.body;

    if (!projectId || !unit || !contractorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(projectId) ||
      !mongoose.Types.ObjectId.isValid(contractorId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid projectId or contractorId" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 1. Add to contractors array if not already present
    if (!project.contractors.includes(contractorId)) {
      project.contractors.push(contractorId);
    }

    // 2. Add contractor to assignedContractors map for the unit
    const currentAssigned = project.assignedContractors.get(unit) || [];

    if (!currentAssigned.includes(contractorId)) {
      currentAssigned.push(contractorId);
      project.assignedContractors.set(unit, currentAssigned);
    }

    await project.save();

    res
      .status(200)
      .json({ message: "Contractor assigned successfully", project });
  } catch (error) {
    console.error("Error assigning contractor:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const projectDropDownData = asyncHandler(async (req, res) => {
  const projects = await Project.find({})
    .select("_id projectId")
    .populate("projectId", "_id projectName");
  let message;
  if (!projects || projects.length === 0) {
    message = "No projects found";
  } else {
    message = "Projects fetched successfully";
  }

  res.status(200).json(new ApiResponse(201, projects, message));
});
