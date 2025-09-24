import express from "express";
import {
  getContactInfo,
  updateContactInfo,
} from "../controller/contactInfoController.js";

import nodemailer from "nodemailer";

const router = express.Router();

router.get("/contactInfo", getContactInfo);
router.post("/updateContactInfo", updateContactInfo);
router.post("/send-email", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // 1️⃣ Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2️⃣ Send email
    await transporter.sendMail({
      from: `"${name}" <${email}>`, // sender
      to: process.env.EMAIL_USER, // your admin email
      subject: `[Contact Form] ${subject}`,
      html: `
        <h3>New Contact Form Submission From CSK Realtors</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
});

export default router;
