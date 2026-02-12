import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

export async function executeCode(
  code: string,
  timeLimit: number,
  memoryLimit: number,
  input: string,
  expectedOutput: string,
) {
  const filename = `code_${Date.now()}_${Math.random().toString(36).substring(7)}.js`;
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
      error: result.stderr || null,
      executionTime: result.executionTime,
    };
  } catch (error: any) {
    let errorType = "runtime_error";

    if (error.killed && error.signal === "SIGTERM") {
      errorType = "time_limit_exceeded";
    } else if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
      errorType = "runtime_error";
    }

    return {
      res: errorType,
      error: errorType,
      executionTime: null,
    };
  } finally {
    try {
      await unlink(filepath);
    } catch (cleanupError) {
      console.error("Failed to cleanup temp file:", cleanupError);
    }
  }
}

function executeWithInput(
  filepath: string,
  input: string,
  timeLimit: number,
  memoryLimit: number,
): Promise<{ stdout: string; stderr: string; executionTime: number }> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now(); // Track start time
    const child = spawn("node", [filepath], { timeout: timeLimit * 1000 });

    let stdout = "";
    let stderr = "";
    let memoryExceeded = false;

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    //Collect output
    child.stdout.on("data", (data) => {
      stdout += data.toString();

      if (stdout.length > memoryLimit) {
        memoryExceeded = true;
        child.kill();
      }
    });

    //Collect input
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    //Handle timeout
    const timer = setTimeout(() => {
      child.kill();
      reject({ type: "TIMEOUT", message: "Time limit exceeded" });
    }, timeLimit * 1000);

    //Handle completion
    child.on("close", (code) => {
      clearTimeout(timer);
      const executionTime = Date.now() - startTime; // Calculate execution time

      if (memoryExceeded) {
        reject({ type: "MEMORY_EXCEEDED", message: "Memory limit exceeded" });
      } else if (code !== 0 && code !== null) {
        reject({
          type: "RUNTIME_ERROR",
          message: `Process exited with code ${code}`,
        });
      } else {
        resolve({ stdout, stderr, executionTime }); // Include executionTime
      }
    });

    //Handle errors
    child.on("error", (error) => {
      clearTimeout(timer);
      reject({ type: "RUNTIME_ERROR", message: error.message });
    });
  });
}
