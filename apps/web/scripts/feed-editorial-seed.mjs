#!/usr/bin/env node
/** @deprecated Use feed:editorial-maintain */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const res = spawnSync(process.execPath, [path.join(dir, "feed-editorial-maintain.mjs"), ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(res.status ?? 1);
