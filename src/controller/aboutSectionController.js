import AboutSection from "../modals/aboutSectionModal.js";

export const addAboutSection = async (req, res) => {
  try {
    const { mainTitle, paragraph1, paragraph2, image, stats, values } =
      req.body;

    // Validate required fields
    if (!mainTitle) {
      return res.status(400).json({ message: "Main title is required" });
    }

    // Create and save new document
    const aboutData = new AboutSection({
      mainTitle,
      paragraph1,
      paragraph2,
      image,
      stats,
      values,
    });

    const savedAbout = await aboutData.save();

    res.status(201).json({
      message: "About section added successfully",
      data: savedAbout,
    });
  } catch (error) {
    console.error("Error adding About section:", error);
    res.status(500).json({
      message: "Failed to add About section",
      error: error.message,
    });
  }
};

export const getAllAboutSection = async (req, res) => {
  try {
    const aboutSection = await AboutSection.findOne();
    if (!aboutSection) {
      return res.status(404).json({ message: "About Section not found" });
    }
    res.json(aboutSection);
  } catch (error) {
    console.error("Error adding About section:", error);
    res.status(500).json({
      message: "Failed to add About section",
      error: error.message,
    });
  }
};

export const updateAboutSection = async (req, res) => {
  try {
    const { id } = req.params; // Get ID from URL
    const updateData = req.body; // New data from frontend

    const updatedSection = await AboutSection.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return updated document
    );

    if (!updatedSection) {
      return res.status(404).json({ message: "About section not found" });
    }

    res.status(200).json({
      message: "About section updated successfully",
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error updating about section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAboutSection = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSection = await AboutSection.findByIdAndDelete(id);

    if (!deletedSection) {
      return res.status(404).json({ message: "About section not found" });
    }

    res.status(200).json({
      message: "About section deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting about section:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
