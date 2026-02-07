import express, { Router } from "express";
import authRoutes from "./auth.routes";
import contestRoutes from "./contest.routes";

const router: Router = express.Router();

router.use("/auth", authRoutes);
router.use("/contests", contestRoutes);

export default router;
