import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { nomogramDatasetSchema } from "../src/types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const raw = JSON.parse(readFileSync(join(root, "data/nomograms.json"), "utf8"));
nomogramDatasetSchema.parse(raw);
console.log(`OK: ${raw.nomograms.length} nomograms validated`);
