#!/usr/bin/env node
// Fail CI when a green build does not produce what package.json promises.
//
// n8n loads this package through the "n8n" block, and npm consumers through
// "main". A build can succeed while emitting none of those paths -- 1.0.4
// shipped to npm with "main": "dist/index.js" and no dist/index.js in the
// tarball, because tsconfig's include did not cover index.ts.
'use strict';

const fs = require('fs');
const path = require('path');

const pkg = require(path.join(process.cwd(), 'package.json'));
const problems = [];

// 1. Every entry point the manifest declares must exist after the build.
const declared = [
  pkg.main,
  ...((pkg.n8n && pkg.n8n.nodes) || []),
  ...((pkg.n8n && pkg.n8n.credentials) || []),
].filter(Boolean);

if (declared.length === 0) problems.push('package.json declares no entry points');

for (const rel of declared) {
  const ok = fs.existsSync(rel);
  console.log(`${ok ? '  OK   ' : '  MISS '}${rel}`);
  if (!ok) problems.push(`declared entry point missing: ${rel}`);
}

// 2. Node icons must be copied into dist, or the node renders without one.
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]
      )
    : [];

const icons = walk('nodes').filter((f) => /\.(svg|png)$/.test(f));
console.log(`  icons in nodes/: ${icons.length}`);
for (const icon of icons) {
  const copied = path.join('dist', icon);
  if (!fs.existsSync(copied)) problems.push(`icon not copied to dist: ${copied}`);
}
if (icons.length === 0) problems.push('no node icon found under nodes/');

if (problems.length) {
  console.error('FAIL:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

console.log(`OK: ${declared.length} declared entry points and ${icons.length} icon(s) present`);
