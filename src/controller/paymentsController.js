import Payment from "../modals/payment.js";

export const getAccountantPayments = async (req, res) => {
  try {
    const accountantId = req.user._id;

    // const payments = await Payment.find({ accountant: accountantId })
    //   .populate("invoice") // populate the invoice field with full object
    //   .sort({ createdAt: -1 }); // latest first (optional)

    const payments = await Payment.find({ accountant: accountantId })
      .populate({
        path: "invoice",
        populate: {
          path: "project", // Invoice.project
          populate: {
            path: "projectId", // Project.projectId
            model: "Property", // explicitly specify if needed
            select: "basicInfo.projectName", // only fetch what you need
          },
        },
      })
      .populate("accountant")
      .sort({ createdAt: -1 });

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
