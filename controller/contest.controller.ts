import type { Request, Response } from "express";
import z from "zod";
import { prisma } from "../lib";

const contestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().datetime({ message: "Invalid datetime format" }),
  endTime: z.string().datetime({ message: "Invalid datetime format" }),
});

const controller = {
  createContest: async (req: Request, res: Response) => {
    try {
      if (!req.user?.userId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: "FORBIDDEN",
        });
      }

      const validationResult = contestSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      const { title, description, startTime, endTime } = validationResult.data;

      const contest = await prisma.contests.create({
        data: {
          creator_id: req.user.userId,
          title,
          description,
          start_time: new Date(startTime),
          end_time: new Date(endTime),
        },
        select: {
          id: true,
          creator_id: true,
          title: true,
          description: true,
          start_time: true,
          end_time: true,
        },
      });

      const data = {
        id: contest.id,
        creatorId: contest.creator_id,
        title,
        description,
        startTime: contest.start_time,
        endTime: contest.end_time,
      };

      return res.status(201).json({
        success: true,
        data: data,
        error: null,
      });
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({
          success: false,
          data: null,
          error: "CONTEST_ALREADY_EXISTS",
        });
      }

      console.error(error);
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
export default controller;
