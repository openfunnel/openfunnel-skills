#!/usr/bin/env node

/**
 * postinstall.js — Runs after `npm install openfunnel`.
 *
 * Injects a summary pointer block into the project's CLAUDE.md so that
 * Claude Code discovers OpenFunnel automatically.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const START_MARKER = "<!-- openfunnel:start -->";
const END_MARKER = "<!-- openfunnel:end -->";

// ---------------------------------------------------------------------------
// Read skill frontmatter to build the skill list dynamically
// ---------------------------------------------------------------------------

function readSkills() {
  const skillsDir = resolve(__dirname, "skills");
  if (!existsSync(skillsDir)) return [];

  const skills = [];
  for (const file of readdirSync(skillsDir).filter((f) => f.endsWith(".md"))) {
    const content = readFileSync(resolve(skillsDir, file), "utf-8");
    const m = content.match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    const nameM = m[1].match(/^name:\s*(.+)$/m);
    const descM = m[1].match(/^description:\s*(.+)$/m);
    if (nameM && descM)
      skills.push({ name: nameM[1].trim(), description: descM[1].trim() });
  }
  return skills;
}

// ---------------------------------------------------------------------------
// Build and inject the pointer block
// ---------------------------------------------------------------------------

function buildPointerBlock(skills) {
  const lines = skills
    .map((s) => `- **${s.name}** — ${s.description}`)
    .join("\n");

  return `${START_MARKER}
## OpenFunnel SDK

This project uses the \`openfunnel\` package for GTM intelligence.

### Available Skills
${lines}

### Usage
Read \`node_modules/openfunnel/CLAUDE.md\` for full routing logic and instructions.
Skill workflows: \`node_modules/openfunnel/skills/{skill_name}.md\`

### Environment
\`OPENFUNNEL_API_KEY\` and \`OPENFUNNEL_USER_ID\` are loaded from \`.env\`.
${END_MARKER}`;
}

function injectIntoClaudeMd(claudeMdPath, block) {
  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, block + "\n", "utf-8");
    return "created";
  }

  const existing = readFileSync(claudeMdPath, "utf-8");
  const si = existing.indexOf(START_MARKER);
  const ei = existing.indexOf(END_MARKER);

  let updated;
  if (si !== -1 && ei !== -1) {
    updated =
      existing.slice(0, si) + block + existing.slice(ei + END_MARKER.length);
  } else {
    updated = existing.trimEnd() + "\n\n" + block + "\n";
  }

  if (updated !== existing) {
    writeFileSync(claudeMdPath, updated, "utf-8");
    return "updated";
  }
  return "unchanged";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

// npm sets INIT_CWD to the directory where `npm install` was run.
// Fall back to walking up from node_modules/openfunnel/ if not set.
const projectRoot = process.env.INIT_CWD || resolve(__dirname, "..", "..");
const claudeMdPath = resolve(projectRoot, "CLAUDE.md");

const skills = readSkills();
const block = buildPointerBlock(skills);
const result = injectIntoClaudeMd(claudeMdPath, block);

if (result !== "unchanged") {
  console.log(`[openfunnel] CLAUDE.md ${result} with OpenFunnel skills.`);
}
