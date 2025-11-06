🏠 Real Estate Management Backend

A powerful and scalable Node.js + Express backend for managing real estate operations — including properties, users, leads, commissions, approvals, and document workflows.
This backend is built with MongoDB, Mongoose, JWT authentication, and RESTful APIs — designed to integrate seamlessly with a React/Next.js frontend.

🚀 Features

✅ Role-Based Access Control (RBAC) — Admin, Owner, Sales Manager, Team Lead, Agent, Contractor, Site Incharge
✅ Authentication & Authorization — JWT-based secure login and route protection
✅ Property Management — CRUD operations for buildings, floors, units, and amenities
✅ Lead Management — Track client leads, assign to agents, and manage their progress
✅ Commission Tracking — Manage paid/pending commissions per agent or team lead
✅ Document Management — Upload, view, and manage property-related documents
✅ Approval Workflows — Site visit approvals, floor approvals, and more
✅ Analytics & Dashboard APIs — Aggregated data for dashboards by role
✅ Notification System — Event-based notifications for important actions
✅ Image Uploads — Supports thumbnail, gallery, and brochure uploads
✅ Optimized Querying — Using Mongoose aggregation pipelines and indexes
✅ Secure API Design — Input validation, error handling, and access control

🧩 Tech Stack
| Layer                      | Technology               |
| -------------------------- | ------------------------ |
| **Runtime**                | Node.js                  |
| **Framework**              | Express.js               |
| **Database**               | MongoDB with Mongoose    |
| **Authentication**         | JWT (JSON Web Token)     |
| **File Uploads**           | Multer                   |
| **Environment Management** | dotenv                   |
| **Validation**             | Express Validator        |
| **Caching (optional)**     | Tanstack                 |
| **API Testing**            | Postman                  |

📂 Project Structure
csk-real-estate-backend/
├── src/
│   ├── config/
│   │   └── db.js                # Database connection
│   ├── controllers/             # Controller logic
│   ├── modals/                  # Mongoose schemas
│   ├── routes/                  # Express routes
│   ├── middleware/              # Auth, error handlers, etc.
│   ├── utils/                   # Helper functions, constants
│   └── uploads/                 # Uploaded files
├── .env                         # Environment variables
├── package.json
├── README.md
└── server.js                    # Entry point

⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/<your-username>/realestate-backend.git
cd realestate-backend

2️⃣ Install dependencies
npm install

3️⃣ Create .env file
.env

4️⃣ Run the server
npm start



