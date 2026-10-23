import m00_physics from "../data/modules/m00_physics.md";
import m01_new_methods from "../data/modules/m01_new_methods.md";
import m02_artifacts from "../data/modules/m02_artifacts.md";
import m03_tips from "../data/modules/m03_tips.md";
import m10_sagittal_anatomy from "../data/modules/m10_sagittal_anatomy.md";
import m11_aorta from "../data/modules/m11_aorta.md";
import m12_heart_ivc from "../data/modules/m12_heart_ivc.md";
import m13_selfcheck_ch1 from "../data/modules/m13_selfcheck_ch1.md";
import m20_ch2_transverse from "../data/modules/m20_ch2_transverse.md";
import m30_ch3_porta from "../data/modules/m30_ch3_porta.md";
import m40_ch4_liver from "../data/modules/m40_ch4_liver.md";
import m50_ch5_kidneys from "../data/modules/m50_ch5_kidneys.md";
import m60_ch6_thyroid_git from "../data/modules/m60_ch6_thyroid_git.md";
import m70_ch7_bladder_gyn from "../data/modules/m70_ch7_bladder_gyn.md";
import m80_ch8_fast from "../data/modules/m80_ch8_fast.md";
import m90_ch9_peds from "../data/modules/m90_ch9_peds.md";
import m99_appendix from "../data/modules/m99_appendix.md";

const MODULE_MARKDOWN: Record<string, string> = {
  m00_physics,
  m01_new_methods,
  m02_artifacts,
  m03_tips,
  m10_sagittal_anatomy,
  m11_aorta,
  m12_heart_ivc,
  m13_selfcheck_ch1,
  m20_ch2_transverse,
  m30_ch3_porta,
  m40_ch4_liver,
  m50_ch5_kidneys,
  m60_ch6_thyroid_git,
  m70_ch7_bladder_gyn,
  m80_ch8_fast,
  m90_ch9_peds,
  m99_appendix,
};

export function listModuleIds(): string[] {
  return Object.keys(MODULE_MARKDOWN).sort();
}

export function readModuleMarkdown(moduleId: string): string | null {
  const safe = moduleId.replace(/[^a-z0-9_]/gi, "");
  return MODULE_MARKDOWN[safe] ?? null;
}
