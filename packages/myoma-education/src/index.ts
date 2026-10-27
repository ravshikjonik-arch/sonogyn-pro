import atlas from "../data/atlas.json";
import manifest from "../data/content-manifest.json";
import dimensions from "../data/image-dimensions.json";
import quiz from "../data/quiz.json";
import definitions from "../calculators/definitions.json";

export const MYOMA_COURSE_ID = "sonogyn-pro-myoma-education";
export const MYOMA_DISCLAIMER =
  "Учебный материал по лекции. Расчёты описывают введённые размеры и топографию. Они не ставят диагноз и не назначают лечение.";

export const myomaManifest = manifest;
export const myomaModules = manifest.modules;
export const myomaAtlas = atlas.items;
export const myomaQuiz = quiz;
export const myomaDefinitions = definitions;
export const myomaImageDimensions = dimensions as Record<string, { width: number; height: number }>;

export type MyomaModule = (typeof manifest.modules)[number];
export type MyomaAtlasItem = (typeof atlas.items)[number];
export type MyomaQuizQuestion = (typeof quiz.questions)[number];

export function myomaImageSrc(imagePath: string): string {
  const file = imagePath.split("/").pop() ?? imagePath;
  return `/education/myoma/${file}`;
}

export function prepareMyomaMarkdown(markdown: string): string {
  return markdown.replaceAll("../assets/images/", "/education/myoma/");
}
