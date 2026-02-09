import type { Request, Response } from "express";
import z, { number } from "zod";
import { prisma } from "../lib";

const contestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.string().datetime({ message: "Invalid datetime format" }),
  endTime: z.string().datetime({ message: "Invalid datetime format" }),
});
const mcqQuestionSchema = z
  .object({
    questionText: z.string().min(2),
    options: z.array(z.string()).min(1).max(4),
    correctOptionIndex: z.number().int().nonnegative(),
    points: z.number().positive(),
  })
  .refine(
    (data) =>
      data.correctOptionIndex >= 0 &&
      data.correctOptionIndex < data.options.length,
    {
      message: "correctOptionIndex is out of bounds",
      path: ["correctOptionIndex"],
    },
  );

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
  getContest: async (req: Request, res: Response) => {
    try {
      const contestId = req.params.contestId;
      const parsedContestId = Number(contestId);

      if (isNaN(parsedContestId)) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "CONTEST_NOT_FOUND",
        });
      }

      const contest = await prisma.contests.findFirst({
        where: {
          id: parsedContestId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          start_time: true,
          end_time: true,
          creator_id: true,
          mcqs: {
            select: {
              id: true,
              question_text: true,
              options: true,
              points: true,
            },
          },
          dsaProblems: {
            select: {
              id: true,
              title: true,
              description: true,
              tags: true,
              points: true,
              time_limit: true,
              memory_limit: true,
            },
          },
        },
      });

      if (!contest) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "CONTEST_NOT_FOUND",
        });
      }

      const data = {
        id: contest.id,
        title: contest.title,
        description: contest.description,
        startTime: contest.start_time,
        endTime: contest.end_time,
        creatorId: contest.creator_id,
        mcqs: contest.mcqs.map((mcq) => ({
          id: mcq.id,
          questionText: mcq.question_text,
          options: mcq.options,
          points: mcq.points,
        })),
        dsaProblems: contest.dsaProblems.map((problem) => ({
          id: problem.id,
          title: problem.title,
          description: problem.description,
          tags: problem.tags,
          points: problem.points,
          timeLimit: problem.time_limit,
          memoryLimit: problem.memory_limit,
        })),
      };

      return res.status(200).json({
        success: true,
        data: data,
        error: null,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
  createMcq: async (req: Request, res: Response) => {
    try {
      const contestId = req.params.contestId;
      const parsedContestId = Number(contestId);

      if (isNaN(parsedContestId) || !contestId) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "CONTEST_NOT_FOUND",
        });
      }

      const validationResult = mcqQuestionSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      const { questionText, options, correctOptionIndex, points } =
        validationResult.data;

      try {
        const mcq = await prisma.mcqQuestions.create({
          data: {
            contest_id: parsedContestId,
            question_text: questionText,
            options: options,
            correct_option_index: correctOptionIndex,
            points: points,
          },
          select: {
            id: true,
            contest_id: true,
          },
        });

        const data = {
          id: mcq.id,
          contestId: mcq.contest_id,
        };

        return res.status(201).json({
          success: true,
          data: data,
          error: null,
        });
      } catch (error: any) {
        if (error.code === "P2003") {
          return res.status(404).json({
            success: false,
            data: null,
            error: "CONTEST_NOT_FOUND",
          });
        }
        throw error;
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
export default controller;
