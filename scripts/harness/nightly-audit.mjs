import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");
const reportPath = path.resolve(repoRoot, "coverage/harness-audit-report.json");

const checks = [];

const addCheck = (name, ok, detail) => {
  checks.push({ name, ok, detail });
};

const readJson = async (relativePath) => {
  const raw = await fs.readFile(path.resolve(repoRoot, relativePath), "utf8");
  return JSON.parse(raw);
};

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const walk = async (targetPath, files) => {
  const stats = await fs.stat(targetPath);
  if (stats.isFile()) {
    files.push(targetPath);
    return;
  }

  if (!stats.isDirectory()) return;

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if ([".git", "node_modules", "dist", "coverage", ".yarn", ".pnp.cjs", ".pnp.loader.mjs"].includes(entry.name)) {
      continue;
    }
    await walk(path.join(targetPath, entry.name), files);
  }
};

const extractInvariantIds = (content) => {
  const matched = content.match(/\bINV-CORE-[A-Z0-9-]+\b/g) || [];
  return [...new Set(matched)].sort();
};

const main = async () => {
  const requiredDocs = [
    "docs/harness/repo-map.md",
    "docs/harness/invariants.md",
    "docs/testing/testbook.md",
  ];

  for (const relative of requiredDocs) {
    const absolute = path.resolve(repoRoot, relative);
    addCheck(`doc:${relative}`, await pathExists(absolute), absolute);
  }

  const pkg = await readJson("package.json");
  const requiredScripts = [
    "testbook",
    "test:tui-compat",
    "test:web-compat",
    "harness:verify",
    "harness:audit",
  ];

  for (const scriptName of requiredScripts) {
    addCheck(`script:${scriptName}`, Boolean(pkg.scripts?.[scriptName]), pkg.scripts?.[scriptName] || "missing");
  }

  const ciPath = path.resolve(repoRoot, ".github/workflows/ci.yml");
  const ciRaw = await fs.readFile(ciPath, "utf8");
  for (const job of ["core-testbook", "tui-consumer-compat", "web-consumer-compat"]) {
    addCheck(`ci-job:${job}`, ciRaw.includes(`${job}:`), ".github/workflows/ci.yml");
  }

  const invariantsPath = path.resolve(repoRoot, "docs/harness/invariants.md");
  const invariantsRaw = await fs.readFile(invariantsPath, "utf8");
  const invariantIds = extractInvariantIds(invariantsRaw);
  addCheck("invariants:ids-present", invariantIds.length > 0, `${invariantIds.length} ids`);

  const referenceFiles = [];
  for (const relative of ["src", "scripts", ".github/workflows", "AGENTS.md", "package.json"]) {
    const absolute = path.resolve(repoRoot, relative);
    if (await pathExists(absolute)) {
      await walk(absolute, referenceFiles);
    }
  }

  const invariantReferences = [];
  for (const id of invariantIds) {
    const files = [];
    for (const filePath of referenceFiles) {
      const raw = await fs.readFile(filePath, "utf8");
      if (raw.includes(id)) {
        files.push(path.relative(repoRoot, filePath));
      }
    }
    const ok = files.length > 0;
    addCheck(`invariant-ref:${id}`, ok, ok ? files.join(", ") : "not referenced in src/scripts/workflows");
    invariantReferences.push({ id, files, ok });
  }

  const failed = checks.filter((check) => !check.ok);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repo: "chambr-core",
    status: failed.length ? "error" : "ok",
    checks,
    invariants: invariantReferences,
  };

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (failed.length) {
    process.stderr.write(`[harness:audit] failed ${failed.length} checks -> ${reportPath}\n`);
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`[harness:audit] ok (${checks.length} checks) -> ${reportPath}\n`);
};

await main();
