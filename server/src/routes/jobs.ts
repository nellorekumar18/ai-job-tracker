import { Router } from "express";
import prisma from "../prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Create a new job application
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      company,
      jobTitle,
      location,
      jobUrl,
      status,
      notes,
      appliedDate,
      followUpAt,
    } = req.body;

    // Basic validation
    if (!company || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Company and job title are required",
      });
    }

    // Get logged-in user
    const user = req.user as {
      id: number;
      email: string;
    };

    // Validate application status
    const validStatuses = ["SAVED", "APPLIED", "INTERVIEW", "OFFER", "REJECTED"];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid application status",
        validStatuses, 
      });
    }

    // Create job application
    const job = await prisma.jobApplication.create({
      data: {
        company,
        jobTitle,
        location,
        jobUrl,
        status: status || "SAVED",
        notes,
        appliedAt: appliedDate ? new Date(appliedDate) : null,
        followUpAt: followUpAt ? new Date(followUpAt) : null, 
        userId: user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: "Job application created successfully",
      job,
    });
  } catch (error) {
    console.error("Create job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create job application",
    });
  }
});


// Get all job applications for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = req.user as {
      id: number;
      email: string;
    };

    const jobs = await prisma.jobApplication.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error("Get jobs error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch job applications",
    });
  }
});

// Update a job application
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user as {
      id: number;
      email: string;
    };

    const jobId = Number(req.params.id);

    const {
      company,
      jobTitle,
      location,
      jobUrl,
      status,
      notes,
      appliedDate,
      followUpAt, 
    } = req.body;

    // Check that the job belongs to the logged-in user
    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    const updatedJob = await prisma.jobApplication.update({
      where: {
        id: jobId,
      },
      data: {
        company,
        jobTitle,
        location,
        jobUrl,
        status: status || "SAVED",
        notes,
        appliedAt: appliedDate ? new Date(appliedDate) : null,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
      },
    });

    res.json({
      success: true,
      message: "Job application updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update job application",
    });
  }
});


// Delete a job application
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const user = req.user as {
      id: number;
      email: string;
    };

    const jobId = Number(req.params.id);

    // Check that the job belongs to the logged-in user
    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    await prisma.jobApplication.delete({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    res.json({
      success: true,
      message: "Job application deleted successfully",
    });
  } catch (error) {
    console.error("Delete job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete job application",
    });
  }
});

// Update a job application
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const jobId = Number(req.params.id);

    const {
      company,
      jobTitle,
      location,
      jobUrl,
      status,
      notes,
      appliedDate,
      followUpAt,
    } = req.body;

    if (!company || !jobTitle) {
      return res.status(400).json({
        success: false,
        message: "Company and job title are required",
      });
    }

    const user = req.user as {
      id: number;
      email: string;
    };

    const existingJob = await prisma.jobApplication.findFirst({
      where: {
        id: jobId,
        userId: user.id,
      },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: "Job application not found",
      });
    }

    const updatedJob = await prisma.jobApplication.update({
      where: {
        id: jobId,
      },
      data: {
        company,
        jobTitle,
        location,
        jobUrl,
        status: status || "SAVED",
        notes,
        appliedDate: appliedDate ? new Date(appliedDate) : null,
        followUpAt: followUpAt ? new Date(followUpAt) : null,
      },
    });

    res.json({
      success: true,
      message: "Job application updated successfully",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update job error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update job application",
    });
  }
});

export default router;