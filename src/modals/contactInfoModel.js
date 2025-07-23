import mongoose from "mongoose";

const SocialMediaSchema = new mongoose.Schema({
  facebook: { type: String, default: "" },
  twitter: { type: String, default: "" },
  linkedin: { type: String, default: "" },
  instagram: { type: String, default: "" },
});

const ContactInfoSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  workingHours: {
    type: String,
    required: true,
  },
  aboutText: {
    type: String,
    required: true,
  },
  socialMedia: {
    type: SocialMediaSchema,
    default: () => ({}),
  },
}, {
  timestamps: true
});

const contactInfoModel = mongoose.model('ContactInfo', ContactInfoSchema);

export default contactInfoModel;
