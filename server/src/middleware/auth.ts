import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
    };

    req.user = decoded;

    next();
  }  catch (error) {
  console.error(
    "JWT verification failed:",
    error instanceof Error ? error.name : "Unknown error"
  );

  return res.status(403).json({
    success: false,
    message: "Invalid or expired token",
  });
}
 };