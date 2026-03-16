#!/usr/bin/env node

import { createInterface } from "readline/promises";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, chmodSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------

function loadEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const START_MARKER = "<!-- openfunnel:start -->";
const END_MARKER = "<!-- openfunnel:end -->";

function getPackageRoot(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  // dist/cli.js → up 1 to package root
  const up1 = resolve(thisDir, "..");
  if (existsSync(resolve(up1, "skills"))) return up1;
  // running from source (cli.ts at root)
  if (existsSync(resolve(thisDir, "skills"))) return thisDir;
  return thisDir;
}

interface SkillInfo { name: string; description: string }

function readSkills(skillsDir: string): SkillInfo[] {
  if (!existsSync(skillsDir)) return [];
  const skills: SkillInfo[] = [];
  for (const file of readdirSync(skillsDir).filter(f => f.endsWith(".md"))) {
    const content = readFileSync(resolve(skillsDir, file), "utf-8");
    const m = content.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    const nameM = m[1].match(/^name:\s*(.+)$/m);
    const descM = m[1].match(/^description:\s*(.+)$/m);
    if (nameM && descM) skills.push({ name: nameM[1].trim(), description: descM[1].trim() });
  }
  return skills;
}

function generatePointerBlock(skills: SkillInfo[]): string {
  const lines = skills.map(s => `- **${s.name}** — ${s.description}`).join("\n");
  return `${START_MARKER}
## OpenFunnel SDK

This project uses the \`openfunnel\` package for GTM intelligence.

### Available Skills
${lines}

### Usage
The agent should read \`node_modules/openfunnel/CLAUDE.md\` for full routing logic and instructions.
Skill workflows: \`node_modules/openfunnel/skills/{skill_name}.md\`

### Environment
\`OPENFUNNEL_API_KEY\` and \`OPENFUNNEL_USER_ID\` are loaded from \`.env\`.
${END_MARKER}`;
}

function mergeClaudeMd(existing: string | null, block: string): string {
  if (!existing) return block + "\n";
  const si = existing.indexOf(START_MARKER);
  const ei = existing.indexOf(END_MARKER);
  if (si !== -1 && ei !== -1) return existing.slice(0, si) + block + existing.slice(ei + END_MARKER.length);
  return existing.trimEnd() + "\n\n" + block + "\n";
}

function mergeSettings(existing: Record<string, any>): Record<string, any> {
  const s = { ...existing };
  const cmd = ".claude/hooks/init-openfunnel.sh";
  if (!s.hooks) s.hooks = {};
  if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
  const has = s.hooks.SessionStart.some(
    (e: any) => e.hooks?.some((h: any) => h.command === cmd) || e.command === cmd,
  );
  if (!has) {
    s.hooks.SessionStart.push({
      matcher: "startup",
      hooks: [{ type: "command", command: cmd }],
    });
  }
  return s;
}

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const result: Record<string, string> = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    result[k] = v;
  }
  return result;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

// ---------------------------------------------------------------------------
// init (interactive)
// ---------------------------------------------------------------------------

async function init() {
  const cwd = process.cwd();
  const envPath = resolve(cwd, ".env");
  const claudeMdPath = resolve(cwd, "CLAUDE.md");
  const hookDir = resolve(cwd, ".claude/hooks");
  const hookPath = resolve(hookDir, "init-openfunnel.sh");
  const settingsPath = resolve(cwd, ".claude/settings.json");
  const gitignorePath = resolve(cwd, ".gitignore");

  console.log("\nOpenFunnel Setup\n");

  // 1. Credentials
  const existing = parseEnvFile(envPath);
  let apiKey = existing.OPENFUNNEL_API_KEY ?? "";
  let userId = existing.OPENFUNNEL_USER_ID ?? "";

  if (apiKey) {
    const masked = "..." + apiKey.slice(-4);
    const update = await prompt(`API key found (${masked}). Update? (y/N) `);
    if (update.toLowerCase() === "y") apiKey = await prompt("OPENFUNNEL_API_KEY: ");
  } else {
    apiKey = await prompt("OPENFUNNEL_API_KEY: ");
  }

  if (userId) {
    const update = await prompt(`User ID found (${userId}). Update? (y/N) `);
    if (update.toLowerCase() === "y") userId = await prompt("OPENFUNNEL_USER_ID: ");
  } else {
    userId = await prompt("OPENFUNNEL_USER_ID: ");
  }

  // 2. Write .env
  const envVars = { ...existing, OPENFUNNEL_API_KEY: apiKey, OPENFUNNEL_USER_ID: userId };
  const envContent = Object.entries(envVars).map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
  writeFileSync(envPath, envContent, "utf-8");
  console.log("  .env written");

  // 3. Add .env to .gitignore
  if (existsSync(gitignorePath)) {
    const gi = readFileSync(gitignorePath, "utf-8");
    if (!gi.split("\n").some(l => l.trim() === ".env")) {
      writeFileSync(gitignorePath, gi.trimEnd() + "\n.env\n", "utf-8");
      console.log("  .env added to .gitignore");
    }
  } else {
    writeFileSync(gitignorePath, ".env\n", "utf-8");
    console.log("  .gitignore created with .env");
  }

  // 4. Write CLAUDE.md pointer
  const pkgRoot = getPackageRoot();
  const skills = readSkills(resolve(pkgRoot, "skills"));
  const block = generatePointerBlock(skills);
  const existingMd = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, "utf-8") : null;
  writeFileSync(claudeMdPath, mergeClaudeMd(existingMd, block), "utf-8");
  console.log("  CLAUDE.md updated");

  // 5. Create hook
  mkdirSync(hookDir, { recursive: true });
  writeFileSync(hookPath, "#!/bin/bash\nnpx openfunnel init --refresh\nexit 0\n", "utf-8");
  chmodSync(hookPath, 0o755);
  console.log("  .claude/hooks/init-openfunnel.sh created");

  // 6. Merge settings
  let settings: Record<string, any> = {};
  if (existsSync(settingsPath)) {
    settings = JSON.parse(readFileSync(settingsPath, "utf-8"));
  }
  settings = mergeSettings(settings);
  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n", "utf-8");
  console.log("  .claude/settings.json updated with SessionStart hook");

  // 7. Confirmation
  console.log("\nOpenFunnel is ready.\n");
  console.log("Available skills:");
  for (const s of skills) console.log(`  - ${s.name} — ${s.description}`);
  console.log(`\nAPI Key: ...${apiKey.slice(-4)}`);
  console.log(`User ID: ${userId}`);
  console.log("\nRun `claude` to start using OpenFunnel skills.\n");
}

// ---------------------------------------------------------------------------
// refresh (silent, hook-triggered)
// ---------------------------------------------------------------------------

function refresh() {
  const cwd = process.cwd();

  // 1. Pull latest
  try {
    execSync("npm update openfunnel", { cwd, stdio: "ignore" });
  } catch {
    // Offline or other error — continue silently
  }

  // 2. Update CLAUDE.md if skills changed
  const claudeMdPath = resolve(cwd, "CLAUDE.md");
  const pkgRoot = getPackageRoot();
  const skills = readSkills(resolve(pkgRoot, "skills"));
  const block = generatePointerBlock(skills);

  if (existsSync(claudeMdPath)) {
    const current = readFileSync(claudeMdPath, "utf-8");
    const updated = mergeClaudeMd(current, block);
    if (updated !== current) {
      writeFileSync(claudeMdPath, updated, "utf-8");
    }
  }

  // 3. Verify creds
  const envPath = resolve(cwd, ".env");
  const env = parseEnvFile(envPath);
  if (!env.OPENFUNNEL_API_KEY || !env.OPENFUNNEL_USER_ID) {
    process.stderr.write("[openfunnel] Warning: credentials missing in .env. Run 'npx openfunnel init' to set up.\n");
  }
}

// ---------------------------------------------------------------------------
// status
// ---------------------------------------------------------------------------

function status() {
  loadEnv();
  const apiKey = process.env.OPENFUNNEL_API_KEY;
  const userId = process.env.OPENFUNNEL_USER_ID;

  if (!apiKey || !userId) {
    console.error("Missing environment variables:");
    if (!apiKey) console.error("  OPENFUNNEL_API_KEY");
    if (!userId) console.error("  OPENFUNNEL_USER_ID");
    console.error("\nRun 'npx openfunnel init' to set up.");
    process.exit(1);
  }

  console.log("OpenFunnel ready.");
  console.log("API Key: ...%s", apiKey.slice(-4));
  console.log("User ID: %s", userId);
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  if (args.includes("--refresh")) {
    refresh();
  } else {
    init().catch(err => { console.error(err); process.exit(1); });
  }
} else if (command === "status") {
  status();
} else if (command === "--help" || command === "-h") {
  console.log(`
openfunnel — GTM intelligence SDK

Commands:
  init            Set up OpenFunnel in your project (credentials, CLAUDE.md, hooks)
  init --refresh  Silent refresh (used by session hook)
  status          Check current configuration

Usage:
  npx openfunnel init
  npx openfunnel status
`);
} else {
  status();
}
