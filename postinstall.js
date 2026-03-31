#!/usr/bin/env node

/**
 * postinstall.js — Runs after `npm install openfunnel`.
 *
 * Copies the package's CLAUDE.md content into the project's CLAUDE.md
 * so that Claude Code has the full OpenFunnel context on every query.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const START_MARKER = "<!-- openfunnel:start -->";
const END_MARKER = "<!-- openfunnel:end -->";

// ---------------------------------------------------------------------------
// Build the block from the package's own CLAUDE.md
// ---------------------------------------------------------------------------

function buildBlock() {
  const packageClaudeMd = resolve(__dirname, "CLAUDE.md");
  if (!existsSync(packageClaudeMd)) return null;
  const content = readFileSync(packageClaudeMd, "utf-8");
  return `${START_MARKER}\n${content}\n${END_MARKER}`;
}

// ---------------------------------------------------------------------------
// Inject into the project's CLAUDE.md
// ---------------------------------------------------------------------------

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

const block = buildBlock();
if (block) {
  const result = injectIntoClaudeMd(claudeMdPath, block);
  if (result !== "unchanged") {
    console.log(`[openfunnel] CLAUDE.md ${result}.`);
  }
} else {
  console.log("[openfunnel] Warning: package CLAUDE.md not found.");
}
