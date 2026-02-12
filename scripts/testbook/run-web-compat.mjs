import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreRoot = path.resolve(__dirname, "../..");
const defaultWebPath = path.resolve(coreRoot, "../chambr");
const webRoot = process.env.WEB_REPO_PATH ? path.resolve(process.env.WEB_REPO_PATH) : defaultWebPath;

const reportPath = path.resolve(coreRoot, "coverage/web-consumer-compat-report.json");

const steps = [];
const toNonPnpEnv = (baseEnv) => {
  const next = { ...baseEnv };
  delete next.NODE_OPTIONS;
  delete next.NODE_PATH;
  return next;
};

const run = (cwd, args, label, env = process.env) => {
  const startedAt = Date.now();
  execFileSync("yarn", args, {
    cwd,
    stdio: "inherit",
    env,
  });
  steps.push({
    label,
    cwd,
    command: `yarn ${args.join(" ")}`,
    durationMs: Date.now() - startedAt,
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
    invariant: "INV-CORE-WEB-COMPAT",
    status,
    coreRoot,
    webRoot,
    steps,
    ...extra,
  };
  await fs.writeFile(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
};

const main = async () => {
  try {
    await assertPath(coreRoot, "Core repo");
    await assertPath(webRoot, "Web repo");

    run(coreRoot, ["install", "--immutable"], "core-install");
    run(coreRoot, ["build"], "core-build");

    const webEnv = toNonPnpEnv(process.env);
    run(webRoot, ["install", "--frozen-lockfile"], "web-install", webEnv);
    run(
      webRoot,
      ["test:core-compat"],
      "web-core-compat",
      {
        ...webEnv,
        CORE_REPO_PATH: coreRoot,
      }
    );

    await writeReport("ok");
    process.stdout.write(`[web-compat] ok -> ${reportPath}\n`);
  } catch (error) {
    await writeReport("error", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

await main();
