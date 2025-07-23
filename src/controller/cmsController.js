import Banner from "../modals/cms.js";
import ContactInfo from "../modals/contactInfoModel.js";

//! POST /api/banner (Create or Update)
export const upsertBanner = async (req, res) => {
  try {
    const { _id, title, subtitle, cta, image } = req.body;

    if (_id) {
      // Update
      const updated = await Banner.findByIdAndUpdate(
        _id,
        { title, subtitle, cta, image },
        { new: true, runValidators: true }
      );
      if (!updated) {
        return res
          .status(404)
          .json({ success: false, message: "Banner not found" });
      }
      return res
        .status(200)
        .json({ success: true, banner: updated, message: "Banner updated" });
    } else {
      // Create
      const created = await Banner.create({ title, subtitle, cta, image });
      return res
        .status(201)
        .json({ success: true, banner: created, message: "Banner created" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//! GET all banners
export const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//! POST (create or update)
export const upsertBanners = async (req, res) => {
  try {
    const slides = req.body.slides;

    // Delete existing
    await Banner.deleteMany({});

    // Insert new
    const inserted = await Banner.insertMany(slides);
    res.status(200).json({ success: true, banners: inserted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//! DELETE by id
export const deleteBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Banner.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getContactInfo = async (req,res) =>{
  try {
    const info = await ContactInfo.findOne();
    res.json(info);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateContactInfo = async (req,res) =>{
  try {
    let existingDoc = await ContactInfo.findOne();

    if (!existingDoc) {
      const created = await ContactInfo.create(req.body);
      return res.status(201).json(created);
    } else {
      const updated = await ContactInfo.findByIdAndUpdate(
        existingDoc._id,
        req.body,
        { new: true }
      );
      return res.status(200).json(updated);
    }
  } catch (error) {
    console.error('Contact info update error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};


