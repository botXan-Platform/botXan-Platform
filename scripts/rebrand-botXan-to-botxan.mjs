#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REPLACEMENTS = [
  ["BOTXAN", "BOTXAN"],
  ["BotXan", "BotXan"],
  ["botXan", "botXan"],
  ["botXan", "botXan"],
];

const EXCLUDED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".cache",
  ".pnpm-store",
]);

const MIGRATIONS_SEGMENTS = ["packages", "db", "prisma", "migrations"];

function replaceByMap(input) {
  let out = input;
  for (const [from, to] of REPLACEMENTS) {
    out = out.split(from).join(to);
  }
  return out;
}

function isBinary(buffer) {
  for (let i = 0; i < buffer.length; i++) {
    if (buffer[i] === 0) return true;
  }
  return false;
}

function rel(abs) {
  return path.relative(ROOT, abs) || ".";
}

function hasBotXan(text) {
  return /botXan/i.test(text);
}

function isInsideMigrations(absPath) {
  const relative = rel(absPath);
  const parts = relative.split(path.sep);
  for (let i = 0; i <= parts.length - MIGRATIONS_SEGMENTS.length; i++) {
    let ok = true;
    for (let j = 0; j < MIGRATIONS_SEGMENTS.length; j++) {
      if (parts[i + j] !== MIGRATIONS_SEGMENTS[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function walk(absDir, results = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const absPath = path.join(absDir, entry.name);
    results.push(absPath);

    if (entry.isDirectory()) {
      walk(absPath, results);
    }
  }

  return results;
}

function renameTargets() {
  const all = walk(ROOT, []);
  return all
    .filter((absPath) => {
      const base = path.basename(absPath);
      return hasBotXan(base) && !isInsideMigrations(absPath);
    })
    .sort((a, b) => {
      const aDepth = a.split(path.sep).length;
      const bDepth = b.split(path.sep).length;
      return bDepth - aDepth || b.length - a.length;
    });
}

function renamePaths() {
  const targets = renameTargets();

  if (targets.length === 0) {
    console.log("No path rename needed.");
    return;
  }

  for (const oldAbs of targets) {
    if (!fs.existsSync(oldAbs)) continue;

    const oldRel = rel(oldAbs);
    const newRel = replaceByMap(oldRel);
    const newAbs = path.join(ROOT, newRel);

    if (oldAbs === newAbs) continue;

    fs.mkdirSync(path.dirname(newAbs), { recursive: true });

    console.log(`RENAMING: ${oldRel} -> ${newRel}`);
    fs.renameSync(oldAbs, newAbs);
  }
}

function textFiles() {
  return walk(ROOT, []).filter((absPath) => {
    if (isInsideMigrations(absPath)) return false;

    let stat;
    try {
      stat = fs.statSync(absPath);
    } catch {
      return false;
    }

    return stat.isFile();
  });
}

function rewriteContents() {
  const files = textFiles();
  let changed = 0;

  for (const absPath of files) {
    let buf;
    try {
      buf = fs.readFileSync(absPath);
    } catch {
      continue;
    }

    if (isBinary(buf)) continue;

    const original = buf.toString("utf8");
    const updated = replaceByMap(original);

    if (original !== updated) {
      fs.writeFileSync(absPath, updated, "utf8");
      changed++;
      console.log(`UPDATED: ${rel(absPath)}`);
    }
  }

  console.log(`Text files updated: ${changed}`);
}

function findLeftovers() {
  const files = textFiles();
  const leftovers = [];

  for (const absPath of files) {
    let content = "";
    try {
      content = fs.readFileSync(absPath, "utf8");
    } catch {
      continue;
    }

    if (hasBotXan(content)) {
      leftovers.push(`CONTENT: ${rel(absPath)}`);
    }
  }

  const allPaths = walk(ROOT, []);
  for (const absPath of allPaths) {
    const relative = rel(absPath);
    if (hasBotXan(relative) && !isInsideMigrations(absPath)) {
      leftovers.push(`PATH: ${relative}`);
    }
  }

  return leftovers;
}

function main() {
  console.log("--- STEP 1: rename paths ---");
  renamePaths();

  console.log("--- STEP 2: rewrite file contents ---");
  rewriteContents();

  console.log("--- STEP 3: search leftovers ---");
  const leftovers = findLeftovers();

  if (leftovers.length === 0) {
    console.log("No leftovers found outside migrations/build folders.");
  } else {
    console.log("LEFTOVERS FOUND:");
    for (const item of leftovers) {
      console.log(item);
    }
    process.exitCode = 2;
  }

  console.log("Done.");
}

main();
