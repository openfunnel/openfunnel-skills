#!/usr/bin/env node

/**
 * Runs after `npm install openfunnel`.
 *
 * Injects this package's CLAUDE.md guidance into the target project's
 * root `CLAUDE.md` so Claude Code has the OpenFunnel routing context
 * available without requiring users to copy it manually.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const START_MARKER = "<!-- openfunnel:start -->";
const END_MARKER = "<!-- openfunnel:end -->";

function buildBlock() {
  const packageClaudeMd = resolve(__dirname, "CLAUDE.md");
  if (!existsSync(packageClaudeMd)) return null;

  const content = readFileSync(packageClaudeMd, "utf-8");
  return `${START_MARKER}\n${content}\n${END_MARKER}`;
}

function injectIntoClaudeMd(claudeMdPath, block) {
  if (!existsSync(claudeMdPath)) {
    writeFileSync(claudeMdPath, `${block}\n`, "utf-8");
    return "created";
  }

  const existing = readFileSync(claudeMdPath, "utf-8");
  const startIndex = existing.indexOf(START_MARKER);
  const endIndex = existing.indexOf(END_MARKER);

  let updated;
  if (startIndex !== -1 && endIndex !== -1) {
    updated =
      existing.slice(0, startIndex) +
      block +
      existing.slice(endIndex + END_MARKER.length);
  } else {
    updated = `${existing.trimEnd()}\n\n${block}\n`;
  }

  if (updated !== existing) {
    writeFileSync(claudeMdPath, updated, "utf-8");
    return "updated";
  }

  return "unchanged";
}

const projectRoot = process.env.INIT_CWD || resolve(__dirname, "..", "..");
const claudeMdPath = resolve(projectRoot, "CLAUDE.md");

const block = buildBlock();
if (!block) {
  console.log("[openfunnel] Warning: package CLAUDE.md not found.");
  process.exit(0);
}

const result = injectIntoClaudeMd(claudeMdPath, block);
if (result !== "unchanged") {
  console.log(`[openfunnel] CLAUDE.md ${result}.`);
}
