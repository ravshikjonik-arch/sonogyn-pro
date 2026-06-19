export const oradsImageMapping: Record<string, string> = {
  // Изображения из скриншотов ACR.app
  "acr_start_screen": "/images/orads-calculator/screenshots/IMG_7101.png",
  "acr_extraovarian_simple_cysts": "/images/orads-calculator/screenshots/IMG_7104.png",
  "acr_extraovarian_thin_wall_inhomogeneous": "/images/orads-calculator/screenshots/IMG_7106.png",
  "acr_ovarian_adnexal_simple_bloodflow": "/images/orads-calculator/screenshots/IMG_7103.png",
  "acr_extraovarian_tubular_structures": "/images/orads-calculator/screenshots/IMG_7105.png",
  "acr_lesion_other_cystic_solid_irregular_unilocular": "/images/orads-calculator/screenshots/IMG_7114.png",
  "acr_lesion_simple_nonsimple": "/images/orads-calculator/screenshots/IMG_7108.png",
  "acr_lesion_irregular_inner_wall": "/images/orads-calculator/screenshots/IMG_7113.png",
  "acr_lesion_smooth_inner_wall": "/images/orads-calculator/screenshots/IMG_7112.png",
  "acr_ovarian_adnexal_bloodflow_patterns": "/images/orads-calculator/screenshots/IMG_7107.png",
  "acr_ovarian_adnexal_solid_components": "/images/orads-calculator/screenshots/IMG_7110.png",
  "acr_ovarian_adnexal_complex_lesions": "/images/orads-calculator/screenshots/IMG_7111.png",

  // УЗИ-изображения из первого набора
  "ovarian-lesion-1": "/images/orads-calculator/ovarian-lesion-1.png", // Дермоид 1
  "ovarian-lesion-2": "/images/orads-calculator/ovarian-lesion-2.png", // Геморрагическая 1
  "ovarian-lesion-3": "/images/orads-calculator/ovarian-lesion-3.png", // Дермоид 2
  "ovarian-lesion-4": "/images/orads-calculator/ovarian-lesion-4.png",
  "ovarian-lesion-5": "/images/orads-calculator/ovarian-lesion-5.png",
  "ovarian-lesion-6": "/images/orads-calculator/ovarian-lesion-6.png",
  "ovarian-lesion-7": "/images/orads-calculator/ovarian-lesion-7.png",
  "ovarian-lesion-8": "/images/orads-calculator/ovarian-lesion-8.png",
  "ovarian-lesion-9": "/images/orads-calculator/ovarian-lesion-9.png",
  "ovarian-lesion-10": "/images/orads-calculator/ovarian-lesion-10.png",
  "ovarian-lesion-11": "/images/orads-calculator/ovarian-lesion-11.png",
  "ovarian-lesion-12": "/images/orads-calculator/ovarian-lesion-12.png",
  "endometrioid-cyst-1": "/images/orads-calculator/endometrioid-cyst-1.png",

  // Сопоставление imageRef из oradsDecisionTree.ts с файлами
  "atlas/localization": "/images/orads-calculator/screenshots/IMG_7101.png", // Стартовый экран, как общее изображение для локализации
  "atlas/ovarian": "/images/orads-calculator/screenshots/IMG_7103.png", // Пример яичникового образования
  "atlas/extraovarian": "/images/orads-calculator/screenshots/IMG_7104.png", // Пример внеяичникового образования
  "atlas/extraovarian/paraovarian": "/images/orads-calculator/screenshots/IMG_7104.png", // Использовать тот же скриншот, если нет более специфичного
  "atlas/extraovarian/hydrosalpinx": "/images/orads-calculator/screenshots/IMG_7106.png", // Гидросальпинкс
  "atlas/extraovarian/peritoneal_inclusion": "/images/orads-calculator/screenshots/IMG_7105.png", // Перитонеальное включение
  "atlas/physiologic": "/images/orads-calculator/ovarian-lesion-1.png", // Фолликулы, дермоидную кисту можно использовать как пример физиологической кисты
  "atlas/simple_cyst": "/images/orads-calculator/screenshots/IMG_7108.png", // Простая киста (верхний ряд)
  "atlas/solid_dominant": "/images/orads-calculator/screenshots/IMG_7110.png", // Доминирующий солидный компонент
  "atlas/classic_benign": "/images/orads-calculator/dermoid-cyst-1.png", // Классическая доброкачественная (дермоид)
  "atlas/papillary_4plus": "/images/orads-calculator/ovarian-lesion-10.png", // Более 4 папиллярных разрастаний

  // TODO: Если в oradsDecisionTree.ts есть imageRef, которых нет на скриншотах ACR.app
  // и нет подходящего изображения из первого набора, нужно будет создать заглушки или запросить у пользователя.
};

export function getOradsImage(imageRef: string): string | undefined {
  const mappedImage = oradsImageMapping[imageRef];
  if (mappedImage) {
    return mappedImage;
  }
  // Если imageRef не найден в маппинге, можно вернуть заглушку или null
  console.warn(`No image found for imageRef: ${imageRef}`);
  return undefined;
}