import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({
  question: {
    type: String,
    default: "",
    require: true,
  },
  answer: {
    type: String,
    default: "",
    require: true,
  },
});

export default mongoose.models.FaqSchema || mongoose.model("Faq", FaqSchema);
