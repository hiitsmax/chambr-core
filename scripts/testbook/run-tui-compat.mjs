import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreRoot = path.resolve(__dirname, "../..");
const defaultTuiPath = path.resolve(coreRoot, "../chambr-tui");
const tuiRoot = process.env.TUI_REPO_PATH
  ? path.resolve(process.env.TUI_REPO_PATH)
  : defaultTuiPath;

const reportPath = path.resolve(coreRoot, "coverage/tui-consumer-compat-report.json");

const run = (cwd, args) => {
  execFileSync("yarn", args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
};

const assertPath = async (candidate, label) => {
  try {
    const stats = await fs.stat(candidate);
    if (!stats.isDirectory()) {
      throw new Error(`${label} is not a directory: ${candidate}`);
    }
  } catch (error) {
    throw new Error(`${label} not found at ${candidate}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

const writeReport = async (status, extra = {}) => {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  const payload = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status,
    coreRoot,
    tuiRoot,
    ...extra,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const main = async () => {
  try {
    await assertPath(coreRoot, "Core repo");
    await assertPath(tuiRoot, "TUI repo");

    run(coreRoot, ["install", "--immutable"]);
    run(coreRoot, ["build"]);

    // TUI consumes this local core checkout through a file dependency, so
    // immutable install will fail when the core hash differs from TUI lockfile.
    run(tuiRoot, ["install", "--mode=skip-build"]);
    run(tuiRoot, ["test:core-compat"]);

    await writeReport("ok");
    process.stdout.write(`[tui-compat] ok -> ${reportPath}\n`);
  } catch (error) {
    await writeReport("error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

await main();
