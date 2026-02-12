import express, { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import problemController from "../controller/problem.controller";

const router: Router = express.Router();

router.get("/:problemId", authMiddleware, problemController.getProblem);
router.post(
  "/:problemId/submit",
  authMiddleware,
  problemController.submitProblem,
);

export default router;
