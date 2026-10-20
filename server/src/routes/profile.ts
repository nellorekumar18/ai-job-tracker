import { Router } from "express";
import prisma from "../prisma.js";
import { authenticateToken, AuthRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
});

export default router;