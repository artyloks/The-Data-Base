import { mcpRegistry, type MCPToolResult, aiderExecutor } from "../mcp";
import { logger } from "../logger";
import { EventEmitter } from "events";

export type FlywheelPhase = "observe" | "orient" | "decide" | "act" | "heal" | "complete" | "failed";

export interface FlywheelEvent {
  phase: FlywheelPhase;
  iteration: number;
  command?: string;
  output?: string;
  exitCode?: number;
  error?: string;
  fix?: string;
  filesModified?: string[];
  timestamp: Date;
}

export interface FlywheelConfig {
  targetCommand: string;
  workingDir: string;
  maxIterations: number;
  autoFix: boolean;
  successExitCode: number;
  healViaAider: boolean;
}

export interface FlywheelResult {
  success: boolean;
  iterations: number;
  events: FlywheelEvent[];
  finalOutput: string;
  totalDuration: number;
  filesModified: string[];
}

/**
 * Flywheel Engine - Autonomous OODA loop for self-healing code execution
 * 
 * The flywheel rotates through phases:
 * 1. OBSERVE: Run the target command (lint, build, test)
 * 2. ORIENT: Categorize output as Success or Error
 * 3. DECIDE: If error, determine fix strategy via Aider
 * 4. ACT: Apply fix through Aider MCP
 * 5. HEAL: Re-run target command to verify fix
 * 
 * Continues rotating until exit code 0 or max iterations.
 */
export class FlywheelEngine extends EventEmitter {
  private config: FlywheelConfig;
  private events: FlywheelEvent[] = [];
  private iteration = 0;
  private filesModified: string[] = [];

  constructor(config: Partial<FlywheelConfig> & Pick<FlywheelConfig, "targetCommand">) {
    super();
    this.config = {
      workingDir: config.workingDir || process.cwd(),
      maxIterations: config.maxIterations || 10,
      autoFix: config.autoFix ?? true,
      successExitCode: config.successExitCode ?? 0,
      healViaAider: config.healViaAider ?? true,
      targetCommand: config.targetCommand,
    };
  }

  private emit(event: FlywheelEvent["phase"], data: Omit<FlywheelEvent, "phase" | "timestamp">): boolean {
    const flywheelEvent: FlywheelEvent = {
      phase: event,
      timestamp: new Date(),
      ...data,
    };
    this.events.push(flywheelEvent);
    return super.emit("phase", flywheelEvent);
  }

  private async runCommand(command: string): Promise<{ output: string; exitCode: number }> {
    const bashClient = mcpRegistry.getClient("local-bash");
    if (!bashClient) {
      throw new Error("local-bash MCP server not connected");
    }

    const result = await bashClient.callTool("run_command", {
      command: `cd ${this.config.workingDir} && ${command}`,
    });

    const output = result.content
      .map((c) => (c.type === "text" ? c.text : c.type === "error" ? c.error : ""))
      .join("\n");

    // Extract exit code - bash MCP typically includes it
    const exitCodeMatch = output.match(/exit code[:\s]*(\d+)/i) || output.match(/exited with[:\s]*(\d+)/i);
    const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : result.isError ? 1 : 0;

    return { output, exitCode };
  }

  private async generateFix(errorOutput: string): Promise<{ fix: string; filesModified: string[] }> {
    if (!this.config.healViaAider || !aiderExecutor.isAvailable()) {
      logger.warn("Aider not available for healing, attempting basic fix");
      return { fix: "", filesModified: [] };
    }

    // Parse error to extract file paths
    const fileMatches = errorOutput.match(/(?:\/[\w\-./]+\.[a-z]+|[\w\-./]+\.[tj]sx?)/gi) || [];
    const uniqueFiles = [...new Set(fileMatches)].slice(0, 5);

    // Use Aider's run_and_fix for automatic error healing
    const result = await aiderExecutor.architect(`
AUTONOMOUS FIX REQUIRED - DO NOT ASK QUESTIONS

ERROR OUTPUT:
\`\`\`
${errorOutput.slice(0, 4000)}
\`\`\`

TARGET COMMAND: ${this.config.targetCommand}
WORKING DIR: ${this.config.workingDir}
RELEVANT FILES: ${uniqueFiles.join(", ")}

INSTRUCTIONS:
1. Parse the error output completely
2. Identify root cause (syntax, type, import, lint, etc.)
3. Apply MINIMAL fix to resolve the error
4. Do NOT refactor or improve unrelated code
5. Commit with message: "fix: auto-heal flywheel iteration ${this.iteration}"

Execute the fix NOW. No questions. No explanations. Just fix it.
`);

    const output = result.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("\n");

    // Extract modified files from Aider output
    const modifiedMatches = output.match(/(?:Wrote|Modified|Updated|Created)\s+([\w\-./]+\.[a-z]+)/gi) || [];
    const filesModified = modifiedMatches
      .map((m) => m.replace(/^(?:Wrote|Modified|Updated|Created)\s+/i, ""))
      .filter(Boolean);

    this.filesModified.push(...filesModified);

    return { fix: output, filesModified };
  }

  private categorizeOutput(output: string, exitCode: number): "success" | "error" {
    if (exitCode === this.config.successExitCode) return "success";

    // Additional heuristics for common success patterns
    const successPatterns = [
      /✓ No (lint )?errors/i,
      /Build successful/i,
      /All tests passed/i,
      /0 errors/i,
      /compiled successfully/i,
    ];

    for (const pattern of successPatterns) {
      if (pattern.test(output)) return "success";
    }

    return "error";
  }

  async run(): Promise<FlywheelResult> {
    const startTime = Date.now();
    logger.info({ config: this.config }, "Flywheel starting");

    while (this.iteration < this.config.maxIterations) {
      this.iteration++;

      // OBSERVE: Run target command
      this.emit("observe", {
        iteration: this.iteration,
        command: this.config.targetCommand,
      });

      let commandResult: { output: string; exitCode: number };
      try {
        commandResult = await this.runCommand(this.config.targetCommand);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.emit("failed", {
          iteration: this.iteration,
          error: `Failed to execute command: ${errorMsg}`,
        });
        return {
          success: false,
          iterations: this.iteration,
          events: this.events,
          finalOutput: errorMsg,
          totalDuration: Date.now() - startTime,
        };
      }

      // ORIENT: Categorize result
      const category = this.categorizeOutput(commandResult.output, commandResult.exitCode);
      this.emit("orient", {
        iteration: this.iteration,
        output: commandResult.output,
        exitCode: commandResult.exitCode,
      });

      // SUCCESS: Exit the flywheel
      if (category === "success") {
        this.emit("complete", {
          iteration: this.iteration,
          output: commandResult.output,
          exitCode: commandResult.exitCode,
          filesModified: this.filesModified,
        });

        logger.info({ iterations: this.iteration, filesModified: this.filesModified.length }, "Flywheel completed successfully");
        return {
          success: true,
          iterations: this.iteration,
          events: this.events,
          finalOutput: commandResult.output,
          totalDuration: Date.now() - startTime,
          filesModified: this.filesModified,
        };
      }

      // ERROR: Attempt to heal
      if (!this.config.autoFix) {
        this.emit("failed", {
          iteration: this.iteration,
          error: "Auto-fix disabled and command failed",
          output: commandResult.output,
          exitCode: commandResult.exitCode,
        });
        break;
      }

      // DECIDE: Generate fix strategy
      this.emit("decide", {
        iteration: this.iteration,
        error: commandResult.output,
      });

      const { fix, filesModified } = await this.generateFix(commandResult.output);

      // ACT: Apply the fix (Aider already applied it)
      this.emit("act", {
        iteration: this.iteration,
        fix,
        filesModified,
      });

      // HEAL: Loop back to OBSERVE (next iteration)
      this.emit("heal", {
        iteration: this.iteration,
      });

      logger.info({ iteration: this.iteration }, "Flywheel iteration complete, healing...");
    }

    // Max iterations reached
    const lastEvent = this.events[this.events.length - 1];
    this.emit("failed", {
      iteration: this.iteration,
      error: "Max iterations reached without success",
      output: lastEvent?.output,
    });

    logger.warn({ maxIterations: this.config.maxIterations }, "Flywheel max iterations reached");
    return {
      success: false,
      iterations: this.iteration,
      events: this.events,
      finalOutput: lastEvent?.output || "Max iterations reached",
      totalDuration: Date.now() - startTime,
      filesModified: this.filesModified,
    };
  }
}

/**
 * Autonomous Vibe Coder - Runs flywheel until clean exit
 * No permission asking, just fixes until done
 */
export class VibeCodeFlywheel extends FlywheelEngine {
  constructor(command: string, workingDir?: string) {
    super({
      targetCommand: command,
      workingDir: workingDir || process.cwd(),
      maxIterations: 15,
      autoFix: true,
      healViaAider: true,
    });
  }

  /**
   * Run until exit code 0 or max iterations
   * This is the "vibe coding" mode - autonomous healing
   */
  async vibeUntilClean(): Promise<FlywheelResult> {
    logger.info({ command: this["config"].targetCommand }, "Starting vibe code session");
    return this.run();
  }
}

/**
 * Quick flywheel for common operations
 */
export async function runFlywheel(
  command: string,
  options?: Partial<Omit<FlywheelConfig, "targetCommand">>
): Promise<FlywheelResult> {
  const flywheel = new FlywheelEngine({ targetCommand: command, ...options });
  return flywheel.run();
}

/**
 * Convenience functions for common flywheel patterns
 */
export const flywheelPatterns = {
  lint: (dir?: string) =>
    runFlywheel("npm run lint", { workingDir: dir, healViaAider: true }),

  build: (dir?: string) =>
    runFlywheel("npm run build", { workingDir: dir, healViaAider: true }),

  typecheck: (dir?: string) =>
    runFlywheel("npm run typecheck", { workingDir: dir, healViaAider: true }),

  test: (dir?: string) =>
    runFlywheel("npm test", { workingDir: dir, healViaAider: true }),

  custom: (command: string, options?: Partial<Omit<FlywheelConfig, "targetCommand">>) =>
    runFlywheel(command, { healViaAider: true, ...options }),

  /**
   * Vibe code mode - autonomous healing until clean
   */
  vibe: (command: string, dir?: string) => {
    const flywheel = new VibeCodeFlywheel(command, dir);
    return flywheel.vibeUntilClean();
  },
};
