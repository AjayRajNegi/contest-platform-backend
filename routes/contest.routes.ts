import express, { Router } from "express";
import contestController from "../controller/contest.controller";
import { creatorMiddleware } from "../middleware/creator.middleware";

const router: Router = express.Router();

router.post("/", creatorMiddleware, contestController.createContest);

export default router;
