// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongodb from "./src/config/db.js";
import csrf from "csurf";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

// Routes
import propertyRoutes from "./src/routes/propertyRoute.js";
import userRoutes from "./src/routes/userRoutes.js";
import roleRoutes from "./src/routes/roleRoutes.js";
import cmsRoutes from "./src/routes/cmsRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import projectRoutes from "./src/routes/projectRoutes.js";
import siteInspectionRoutes from "./src/routes/siteInspectionRoutes.js";
import fileUploadRoutes from "./src/routes/fileUploadRoutes.js";
import userScheduleRoutes from "./src/routes/userScheduleRoutes.js";
import qualityIssueRoutes from "./src/routes/qualityIssueRoutes.js";
import labourTeamRoutes from "./src/routes/labourTeamRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import materialRoutes from "./src/routes/materialRoutes.js";
import invoiceRoutes from "./src/routes/invoiceRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import budgetRoutes from "./src/routes/budgetRoutes.js";
import expenseRoutes from "./src/routes/expenseRoutes.js";
import taxDocumentsRoutes from "./src/routes/taxDocumentsRoutes.js";
import openPlotRoutes from "./src/routes/openPlotRoutes.js";
import contactInfo from "./src/routes/contactInfoRoutes.js";
import aboutSection from "./src/routes/aboutSectionRoutes.js";
import enquiryForm from "./src/routes/enquiryFormRoutes.js";
import authRoutes from "./src/routes/auth.js";
import carAllocation from "./src/routes/carAllocationRoutes.js";
import leads from "./src/routes/leadRoutes.js";
import Team from "./src/routes/teamManagementRoutes.js";
import SiteVisit from "./src/routes/siteVisitRoutes.js";
import Commission from "./src/routes/commissionRoutes.js";
import Customer from "./src/routes/customerRoutes.js";
import Document from "./src/routes/documentRoutes.js";
import TeamLead from "./src/routes/TeamLeadRoutes.js";

dotenv.config();

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080", // frontend origin
    credentials: true,
  },
});

// Store userId to socketId mapping
const onlineUsers = new Map();

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("✅ New socket connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`🔗 User ${userId} registered with socket ID: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
    for (const [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

// Export socket instance and online user map for use in controllers
export { io, onlineUsers };

// Middleware
const PORT = process.env.PORT || 3000;

// Middleware
const allowedOrigins = ["http://localhost:8080"]; // add more if needed

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// CSRF middleware setup (store token in cookies)
const csrfProtection = csrf({ cookie: true });

// Public route to fetch CSRF token
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Connect to MongoDB
await mongodb();

app.use("/api/properties", propertyRoutes);
app.use("/api/user", userRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/cms", cmsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/site-inspection", siteInspectionRoutes);
app.use("/api/uploads", fileUploadRoutes);
app.use("/api/user-schedule", userScheduleRoutes);
app.use("/api/quality-issue", qualityIssueRoutes);
app.use("/api/openPlot", openPlotRoutes);
app.use("/api/labor", labourTeamRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/tax/documents", taxDocumentsRoutes);
app.use("/api/contact", contactInfo);
app.use("/api/aboutSection", aboutSection);
app.use("/api/enquiryForm", enquiryForm);
app.use("/api/auth", authRoutes);
app.use("/api/cars", carAllocation);
app.use("/api/leads", leads);
app.use("/api/team", Team);
app.use("/api/siteVisit", SiteVisit);
app.use("/api/commission", Commission);
app.use("/api/customer", Customer);
app.use("/api/document", Document);
app.use("/api/teamLead", TeamLead);

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
