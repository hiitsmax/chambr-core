import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const reportPath = process.env.TESTBOOK_PREFLIGHT_REPORT
  ? path.resolve(process.env.TESTBOOK_PREFLIGHT_REPORT)
  : path.resolve(repoRoot, "coverage/preflight-report.json");

const checks = [];

const addCheck = (name, ok, detail) => {
  checks.push({ name, ok, detail });
};

const checkCommand = (name, command, args = []) => {
  try {
    const output = execFileSync(command, args, { encoding: "utf8" }).trim();
    addCheck(name, true, output || "ok");
  } catch (error) {
    addCheck(name, false, error instanceof Error ? error.message : String(error));
  }
};

const main = async () => {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
  addCheck("node-version", nodeMajor >= 20, `detected=${process.versions.node} required>=20`);
  checkCommand("yarn-available", "yarn", ["--version"]);
  checkCommand("corepack-available", "corepack", ["--version"]);

  const tempBase = await fs.mkdtemp(path.join(os.tmpdir(), "chambr-core-testbook-"));
  try {
    const probeFile = path.join(tempBase, "write-check.txt");
    await fs.writeFile(probeFile, "ok\n", "utf8");
    const readBack = await fs.readFile(probeFile, "utf8");
    addCheck("temp-home-writable", readBack.trim() === "ok", `tmp=${tempBase}`);
  } finally {
    await fs.rm(tempBase, { recursive: true, force: true });
  }

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repo: "chambr-core",
    checks,
  };

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  const failed = checks.filter((check) => !check.ok);
  if (failed.length > 0) {
    process.stderr.write(`[preflight] failed checks: ${failed.map((check) => check.name).join(", ")}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`[preflight] ok (${checks.length} checks) -> ${reportPath}\n`);
};

await main();
