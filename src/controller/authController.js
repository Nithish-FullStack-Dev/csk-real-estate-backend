import otpGenerator from "otp-generator";
import Otp from "../modals/Otp.js";
import sendEmail from "../utils/emailService.js";

// --- Send OTP  ---
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  try {
    // Generate a 6-digit numeric OTP
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Store OTP in the database (replace existing for the same email)
    await Otp.findOneAndDelete({ email }); // Delete any existing OTPs for this email
    const newOtp = new Otp({ email, otp });
    await newOtp.save();

    // Send OTP via email
    const emailSubject = "Your OTP for Verification";
    const emailText = `Your One-Time Password (OTP) is: ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`;
    const emailHtml = `<p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
                       <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>`;

    await sendEmail(email, emailSubject, emailText, emailHtml);

    res.status(200).json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

// --- Verify OTP ---
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Email and OTP are required." });
  }

  try {
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    // OTP is valid and not expired (thanks to `expires` in schema)
    // Delete the OTP after successful verification to prevent reuse
    await Otp.deleteOne({ _id: otpRecord._id });

    res
      .status(200)
      .json({ success: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};
