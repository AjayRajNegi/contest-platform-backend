import express, { Router } from "express";
import contestController from "../controller/contest.controller";
import { creatorMiddleware } from "../middleware/creator.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

const router: Router = express.Router();

router.post(
  "/",
  authMiddleware,
  creatorMiddleware,
  contestController.createContest,
);
router.get("/:contestId", authMiddleware, contestController.getContest);

export default router;
