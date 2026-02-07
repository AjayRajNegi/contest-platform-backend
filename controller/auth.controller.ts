import type { Request, Response } from "express";
import { prisma } from "../lib";
import z from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const loginSchema = z.object({
  email: z.string().email("Email is invalid."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
});
const signupSchema = z.object({
  email: z.string().email("Email is invalid.").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  name: z.string().min(3, "Name should be atleast 2 characters long."),
  role: z.enum(["contestee", "creator"]).optional().default("contestee"),
});

type loginInput = z.infer<typeof loginSchema>;
type signupInput = z.infer<typeof signupSchema>;

const controller = {
  login: async (req: Request, res: Response) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      const { email, password } = validationResult.data;

      const user = await prisma.user.findFirst({
        where: { email },
        select: { id: true, name: true, password: true, role: true },
      });

      const passwordHash =
        user?.password || "$2b$10$fake.hash.to.prevent.timing.attack";
      const isPasswordValid = await bcrypt.compare(password, passwordHash);

      if (!user || !isPasswordValid) {
        return res.status(401).json({
          success: false,
          data: null,
          error: "INVALID_CREDENTIALS",
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET || "contest_secret";
      if (!JWT_SECRET) {
        throw new Error("JWT_SECRET must be defined");
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      return res.status(200).json({
        success: true,
        data: token,
        error: null,
      });
    } catch (error) {
      console.log("Login error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
  signup: async (req: Request, res: Response) => {
    try {
      const validationResult = signupSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      const { email, password, name, role } = validationResult.data;

      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
        select: {
          email: true,
        },
      });

      if (user) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "EMAIL_ALREADY_EXISTS",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      return res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          email,
          name,
          role,
        },
        error: null,
      });
    } catch (error) {
      console.log("SignUp error:", error);
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
export default controller;
