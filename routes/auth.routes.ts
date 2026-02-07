import express, { Router } from "express";
import authController from "../controller/auth.controller";

const router: Router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);

export default router;
