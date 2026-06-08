#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const i18nPath = path.resolve(__dirname, "..", "src", "i18n.ts");
const src = fs.readFileSync(i18nPath, "utf8");

function extractBlock(language) {
  const startMarker = `${language}: {`;
  const start = src.indexOf(startMarker);
  if (start === -1) {
    throw new Error(`Language block "${language}" not found in src/i18n.ts`);
  }

  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end === -1) {
    throw new Error(`Could not parse language block "${language}"`);
  }
  return src.slice(start, end + 1);
}

function extractKeys(block) {
  const keys = new Set();
  const keyRegex = /^\s{4}([a-zA-Z0-9_]+):/gm;
  let match = keyRegex.exec(block);
  while (match) {
    keys.add(match[1]);
    match = keyRegex.exec(block);
  }
  return keys;
}

function difference(a, b) {
  return [...a].filter((k) => !b.has(k)).sort();
}

const ruKeys = extractKeys(extractBlock("ru"));
const enKeys = extractKeys(extractBlock("en"));
const esKeys = extractKeys(extractBlock("es"));

const missingFromRu = [...new Set([...difference(enKeys, ruKeys), ...difference(esKeys, ruKeys)])];

if (missingFromRu.length > 0) {
  console.error(`\n[i18n] RU base is missing ${missingFromRu.length} key(s):`);
  missingFromRu.forEach((k) => console.error(`  - ${k}`));
  console.error("\nAdd these keys to ru before merging.");
  process.exit(1);
}

console.log(`[i18n] OK: RU contains all keys from EN/ES (${ruKeys.size} keys).`);
