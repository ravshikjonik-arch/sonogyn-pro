import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { curriculumSchema, quizSchema } from "../src/types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
curriculumSchema.parse(JSON.parse(readFileSync(join(root, "data/curriculum.json"), "utf8")));
quizSchema.parse(JSON.parse(readFileSync(join(root, "data/quiz/quiz.json"), "utf8")));
console.log("OK: hofer-basic-course dataset");
