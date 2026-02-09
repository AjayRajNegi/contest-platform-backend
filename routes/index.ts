import express, { Router } from "express";
import authRoutes from "./auth.routes";
import contestRoutes from "./contest.routes";
import problemRoutes from "./problem.routes";

const router: Router = express.Router();

router.use("/auth", authRoutes);
router.use("/contests", contestRoutes);
router.use("/problems", problemRoutes);

export default router;
