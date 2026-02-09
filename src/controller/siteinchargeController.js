import User from "../modals/user.js";

export const getSiteIncharges = async (req, res) => {
  try {
    const siteIncharges = await User.find(
      { role: "site_incharge" },
      { name: 1, email: 1 } // only send what frontend needs
    ).lean();

    return res.status(200).json({
      success: true,
      data: siteIncharges,
    });
  } catch (error) {
    console.error("Error fetching site incharges:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site incharges",
    });
  }
};

