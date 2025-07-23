import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

// Task Schema (for each task in a unit)
const TaskSchema = new Schema({
  contractor:{
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  title:{
    type: String,
    required: true
  },
  statusForContractor: {
    type: String,
    enum: ["In progress","completed","pending review"],
    required: true,
    default: "In progress"
  },
  statusForSiteIncharge: {
    type: String,
    enum: ["pending verification", "approved","rework","rejected"],
    required: true,
    default: "pending verification"
  },
  deadline: {
    type: Date,
    required: true
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  isApprovedByContractor: {
    type: Boolean,
    default: false
  },
  isApprovedBySiteManager: {
    type: Boolean,
    default: false
  },
  // isApprovedByAccountant: {
  //   type: Boolean,
  //   default: false
  // },
  constructionPhase: {
    type: String,
    default: ""
  },
  contractorUploadedPhotos: {
    type: [String],
    default: []
  },
  siteInchargeUploadedPhotos: {
    type: [String],
    default: []
  },
  qualityAssessment: {
    type: String,
    enum: ["", "excellent", "good", "acceptable", "poor"],
    default: ""
  },
  verificationDecision: {
    type: String,
    enum: ["approved","rework","rejected",""],
    default:""
  },
  submittedByContractorOn: {
    type: Date,
  },
  submittedBySiteInchargeOn: {
    type: Date
  },
  evidenceTitleByContractor:{
    type: String
  },
  noteBySiteIncharge: {
    type: String
  },
  priority: {
    type: String
  },
  description: {
    type: String
  },
  // noteByAccountant: {
  //   type: String
  // }
},);

// Flexible Units Schema — Object of arrays of tasks
const UnitSchema = new Schema(
  {
    // unit name as key (Block-A, Block-B, etc.)
    // each key maps to array of tasks
  },
  { strict: false } // to allow dynamic keys (Block-A, Villa-1, etc.)
);

// Project Schema
const ProjectSchema = new Schema({
  projectId: {
    type: Types.ObjectId,
    ref: "Property",
    required: true
  },
  contractors: {
    type: [Types.ObjectId],
    ref: "User",
    required: true
  },
  siteIncharge: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  units: {
    type: Map,
    of: [TaskSchema], // map of unit name -> array of tasks
    default: {}
  },
  deadline: {
    type: Date,
  },
  priority: {
    type: String
  },
  type:{
    type: String
  },
  startDate:{
    type: Date
  },
  endDate:{
    type: Date
  },
  teamSize:{
    type: Number
  },
  estimatedBudget:{
    type: Number
  },
  description:{
    type: String
  },
  budget:{
    type: Number
  },
  status:{
    type: String
  },
  assignedContractors: {
  type: Map,
  of: [{
    type: Types.ObjectId,
    ref: "User"
  }],
  default: {}
}
}, { timestamps: true });

const Project = model("Project", ProjectSchema);
export default Project;
