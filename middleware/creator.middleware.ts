import { type NextFunction, type Request, type Response } from "express";

export function creatorMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const role = req.user?.role;

    if (role !== "creator") {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }
    next();
  } catch (error) {
    console.error("Middleware error:", error);
    return res.status(500).json({
      success: false,
      data: null,
      error: "INTERNAL_ERROR",
    });
  }
}
