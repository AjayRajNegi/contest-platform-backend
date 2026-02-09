import type { Request, Response } from "express";
import { prisma } from "../lib";

const controller = {
  getProblem: async (req: Request, res: Response) => {
    try {
      const problemId = req.params.problemId;
      const parsedProblemId = Number(problemId);

      if (
        isNaN(parsedProblemId) ||
        parsedProblemId <= 0 ||
        !Number.isInteger(parsedProblemId)
      ) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "PROBLEM_NOT_FOUND",
        });
      }

      const problem = await prisma.dsaProblems.findUnique({
        where: { id: parsedProblemId },
        select: {
          contest_id: true,
          title: true,
          description: true,
          tags: true,
          points: true,
          time_limit: true,
          memory_limit: true,
          testCases: {
            where: { is_hidden: false },
            select: {
              input: true,
              expected_output: true,
            },
          },
        },
      });

      if (!problem) {
        return res.status(404).json({
          success: false,
          data: null,
          error: "PROBLEM_NOT_FOUND",
        });
      }

      const response = {
        id: parsedProblemId,
        contestId: problem.contest_id,
        title: problem.title,
        description: problem.description,
        tags: problem.tags,
        points: problem.points,
        timeLimit: problem.time_limit,
        memoryLimit: problem.memory_limit,
        visibleTestCases: problem.testCases.map((testCase) => ({
          input: testCase.input,
          expectedOutput: testCase.expected_output,
        })),
      };

      return res.status(200).json({
        success: true,
        data: response,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching problem:", error);
      return res.status(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
export default controller;
