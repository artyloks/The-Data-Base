import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agentRouter from "./agent";
import flywheelRouter from "./flywheel";
import cliRouter from "./cli";
import mcpRouter from "./mcp";
import agenticRouter from "./agentic";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/agent", agentRouter);
router.use("/flywheel", flywheelRouter);
router.use("/cli", cliRouter);
router.use("/mcp", mcpRouter);
router.use("/agentic", agenticRouter);

export default router;
