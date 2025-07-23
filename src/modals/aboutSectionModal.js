import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  label: { type: String, default: "" },
  value: { type: Number, default: 0 },
});

const valueSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
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
});

export default mongoose.model("AboutSection", aboutSectionSchema);
