import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./prisma";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import resumeRoutes from "./routes/resume";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", require("./routes/jobs.js").default);
// Health check API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Job Tracker API is running",
  });
});

//Database test
app.get("/api/db-test", async (req, res) => {
  try {
    const userCount = await prisma.user.count();

    res.json({
      success: true,
      message: "Database connection successful",
      userCount: userCount
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to connect to database",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});