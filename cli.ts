#!/usr/bin/env node

/**
 * OpenFunnel CLI entry point.
 *
 * Future: terminal UI, interactive scoring, account lookup.
 * For now: validates env vars and prints status.
 */

const API_KEY = process.env.OPENFUNNEL_API_KEY;
const USER_ID = process.env.OPENFUNNEL_USER_ID;

if (!API_KEY || !USER_ID) {
  console.error("Missing environment variables:");
  if (!API_KEY) console.error("  OPENFUNNEL_API_KEY");
  if (!USER_ID) console.error("  OPENFUNNEL_USER_ID");
  console.error("\nSet these before running: export OPENFUNNEL_API_KEY=...");
  process.exit(1);
}

console.log("OpenFunnel CLI ready.");
console.log("API Key: ...%s", API_KEY.slice(-4));
console.log("User ID: %s", USER_ID);
