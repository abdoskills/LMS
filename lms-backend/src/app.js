const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const errorHandler = require("./middleware/error");

// Route files
const auth = require("./routes/auth");
const courses = require("./routes/courses");
const progress = require("./routes/progress");
const users = require("./routes/users");

const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Mount routers
app.use("/api/auth", auth);
app.use("/api/courses", courses);
app.use("/api/progress", progress);
app.use("/api/users", users);

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "LMS Backend is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        getMe: "GET /api/auth/me",
      },
      courses: {
        getAll: "GET /api/courses",
        getSingle: "GET /api/courses/:id",
        create: "POST /api/courses",
        update: "PUT /api/courses/:id",
        delete: "DELETE /api/courses/:id",
        purchase: "POST /api/courses/:id/purchase",
      },
      progress: {
        get: "GET /api/progress",
        update: "PUT /api/progress",
      },
      users: {
        profile: "GET /api/users/profile, PUT /api/users/profile",
        avatar: "POST /api/users/avatar",
        certificates: "GET /api/users/certificates",
        stats: "GET /api/users/stats",
      },
    },
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Error handler middleware (must be after all routes)
app.use(errorHandler);

module.exports = app;
