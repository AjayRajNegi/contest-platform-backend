import { response, type Request, type Response } from "express";
import { prisma } from "../lib";
import z from "zod";
import { executeCode } from "../utils/CodeExecution";
import { isContestActive } from "../utils/IsContestActive";

const dsaSubmissionSchema = z.object({
  code: z.string().min(1),
  language: z.string().min(1),
});
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
  submitProblem: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: "FORBIDDEN",
        });
      }
      const problemId = req.params.problemId;
      const parsedProblemId = Number(problemId);

      if (isNaN(parsedProblemId)) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "PROBLEM_NOT_FOUND",
        });
      }

      const validationResult = dsaSubmissionSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_REQUEST",
        });
      }

      const { code, language } = validationResult.data;

      const problem = await prisma.dsaProblems.findUnique({
        where: { id: parsedProblemId },
        select: {
          contest: {
            select: {
              creator_id: true,
              start_time: true,
              end_time: true,
            },
          },
          points: true,
          time_limit: true,
          memory_limit: true,
          testCases: {
            where: {
              problem_id: parsedProblemId,
              is_hidden: false,
            },
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

      const isActive = isContestActive(
        problem.contest.start_time,
        problem.contest.end_time,
      );

      if (!isActive) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "CONTEST_NOT_ACTIVE",
        });
      }

      if (problem.testCases.length === 0) {
        return res.status(500).json({
          success: false,
          data: null,
          error: "NO_TEST_CASES_AVAILABLE",
        });
      }

      if (problem.contest.creator_id === userId) {
        return res.status(403).json({
          success: false,
          data: null,
          error: "FORBIDDEN",
        });
      }

      // Code Execution ============>
      const totalTestCases = problem.testCases.length;
      let testCasesPassed = 0;
      let executionTime = 0;
      let finalStatus = "";

      let response = {
        status: finalStatus,
        pointsEarned: 0,
        testCasesPassed: 0,
        totalTestCases: 0,
      };

      for (const ele of problem.testCases) {
        const result = await executeCode(
          code,
          problem.time_limit,
          problem.memory_limit,
          ele.input,
          ele.expected_output,
        );

        console.log(result.res);
        if (result.res === "runtime_error") {
          finalStatus = "runtime_error";
          break;
        }
        if (result.res === "wrong_answer") {
          finalStatus = "wrong_answer";
        } else {
          testCasesPassed++;
        }

        executionTime = result.executionTime ?? executionTime;
      }

      if (testCasesPassed === totalTestCases) {
        finalStatus = "accepted";
      }

      const pointsEarned = Math.floor(
        (testCasesPassed / totalTestCases) * problem.points,
      );
      response = {
        ...response,
        status: finalStatus,
        pointsEarned,
        testCasesPassed,
        totalTestCases,
      };

      const submission = await prisma.dsaSubmissions.upsert({
        where: {
          user_id_problem_id: {
            user_id: userId,
            problem_id: parsedProblemId,
          },
        },
        update: {
          code,
          language,
          status: response.status,
          points_earned: pointsEarned,
          test_cases_passed: testCasesPassed,
          total_test_cases: totalTestCases,
          execution_time: executionTime,
        },
        create: {
          user_id: userId,
          problem_id: parsedProblemId,
          code,
          language,
          status: response.status,
          points_earned: pointsEarned,
          test_cases_passed: testCasesPassed,
          total_test_cases: totalTestCases,
          execution_time: executionTime,
        },
      });

      return res.status(201).json({
        success: true,
        data: response,
        error: null,
      });
    } catch (error) {
      return res.json(500).json({
        success: false,
        data: null,
        error: "INTERNAL_SERVER_ERROR",
      });
    }
  },
};
export default controller;
