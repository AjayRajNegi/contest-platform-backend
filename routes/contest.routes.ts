import express, { Router } from "express";
import contestController from "../controller/contest.controller";
import { creatorMiddleware } from "../middleware/creator.middleware";
import { authMiddleware } from "../middleware/auth.middleware";
import { contesteeMiddleware } from "../middleware/contestee.middleware";

const router: Router = express.Router();

router.post(
  "/",
  authMiddleware,
  creatorMiddleware,
  contestController.createContest,
);
router.get("/:contestId", authMiddleware, contestController.getContest);
router.post(
  "/:contestId/mcq",
  authMiddleware,
  creatorMiddleware,
  contestController.createMcq,
);
router.post(
  ":contesId/mcq/:questionId/submit",
  authMiddleware,
  contesteeMiddleware,
  contestController.submitMcq,
);
router.post(
  "/:contestId/dsa",
  authMiddleware,
  creatorMiddleware,
  contestController.createDSA,
);

export default router;
