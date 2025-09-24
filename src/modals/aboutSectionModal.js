import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  value: { type: Number, default: 0 },
});

const valueSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
});

const teamSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  role: { type: String, default: "" },
  image: { type: String, default: "" },
  bio: { type: String, default: "" },
});

const gallerySchema = new mongoose.Schema({
  title: { type: String, default: "" },
  image: { type: String, default: "" },
});

const aboutSectionSchema = new mongoose.Schema({
  mainTitle: {
    type: String,
    default: "",
    required: true,
  },
  paragraph1: {
    type: String,
    default: "",
  },
  paragraph2: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  stats: {
    type: [statsSchema],
    default: [],
  },
  values: {
    type: [valueSchema],
    default: [],
  },
  teamTitle: {
    type: String,
    default: "",
  },
  teamDes: {
    type: String,
    default: "",
  },
  team: { type: [teamSchema], default: [] },
  thumbnail: {
    type: String,
    default: "",
  },
  videoUrl: {
    type: String,
    default: "",
  },
  gallery: {
    type: [gallerySchema],
    default: [],
  },
  galleryTitle: {
    type: String,
    default: "",
  },
  galleryDes: {
    type: String,
    default: "",
  },
});

export default mongoose.model("AboutSection", aboutSectionSchema);
