import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

type ExecutionResult = {
  res:
    | "accepted"
    | "wrong_answer"
    | "runtime_error"
    | "time_limit_exceeded"
    | "memory_limit_exceeded";
  error: string | null;
  executionTime: number | null;
};

export async function executeCode(
  code: string,
  timeLimit: number,
  memoryLimit: number,
  input: string,
  expectedOutput: string,
): Promise<ExecutionResult> {
  const filename = `code_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}.js`;

  const filepath = join(tmpdir(), filename);

  try {
    await writeFile(filepath, code, "utf-8");

    const result = await executeWithInput(
      filepath,
      input,
      timeLimit,
      memoryLimit,
    );

    const actualOutput = result.stdout.trim();
    const isCorrect = actualOutput === expectedOutput.trim();

    return {
      res: isCorrect ? "accepted" : "wrong_answer",
      error: null,
      executionTime: result.executionTime,
    };
  } catch (error: any) {
    let errorType: ExecutionResult["res"] = "runtime_error";

    if (error.type === "TIMEOUT") {
      errorType = "time_limit_exceeded";
    } else if (error.type === "MEMORY_LIMIT_EXCEEDED") {
      errorType = "memory_limit_exceeded";
    } else if (error.type === "RUNTIME_ERROR") {
      errorType = "runtime_error";
    }

    return {
      res: errorType,
      error: error.message || errorType,
      executionTime: null,
    };
  } finally {
    try {
      await unlink(filepath);
    } catch {}
  }
}

function executeWithInput(
  filepath: string,
  input: string,
  timeLimit: number,
  memoryLimit: number,
): Promise<{ stdout: string; executionTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const child = spawn("node", [filepath]);

    let stdout = "";
    let stderr = "";
    let finished = false;

    const safeReject = (err: any) => {
      if (!finished) {
        finished = true;
        reject(err);
      }
    };

    const safeResolve = (val: any) => {
      if (!finished) {
        finished = true;
        resolve(val);
      }
    };

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();

    child.stdout.on("data", (data) => {
      stdout += data.toString();

      if (stdout.length > memoryLimit) {
        child.kill();
        safeReject({
          type: "MEMORY_LIMIT_EXCEEDED",
          message: "Memory limit exceeded",
        });
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      safeReject({
        type: "TIMEOUT",
        message: "Time limit exceeded",
      });
    }, timeLimit * 1000);

    child.on("close", (code, signal) => {
      clearTimeout(timer);

      const executionTime = Date.now() - startTime;

      if (finished) return;

      if (signal) {
        return safeReject({
          type: "RUNTIME_ERROR",
          message: `Process killed by signal ${signal}`,
        });
      }

      if (code !== 0) {
        return safeReject({
          type: "RUNTIME_ERROR",
          message: stderr || `Exited with code ${code}`,
        });
      }

      safeResolve({
        stdout,
        executionTime,
      });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      safeReject({
        type: "RUNTIME_ERROR",
        message: err.message,
      });
    });
  });
}
