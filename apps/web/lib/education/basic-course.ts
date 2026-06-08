export type BasicCourseLecture = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  topics: string[];
  fileName: string;
  yandexDiskUrl: string;
};

export const BASIC_COURSE_DISCLAIMER =
  "Материалы ISUOG Basic Training предназначены для образовательных целей. Не заменяют клиническое суждение врача и официальные протоколы вашей клиники.";

export const ISUOG_BASIC_COURSE = {
  id: "isuog-basic-training",
  title: "ISUOG — базовый курс",
  subtitle: "Basic Training in Obstetric and Gynecological Ultrasound",
  description:
    "Официальная программа ISUOG для базовой подготовки врачей УЗД в акушерстве и гинекологии. Презентации хранятся на Яндекс.Диске — открываются в новой вкладке или во встроенном просмотрщике.",
  issuer: "ISUOG",
  lectures: [
    {
      id: "lecture-6-early-pregnancy-4-10",
      number: 6,
      title: "Ранняя беременность 4–10 недель",
      subtitle:
        "Оценка нормальных и аномальных эхографических признаков одноплодной и многоплодной беременности",
      topics: [
        "Плодное яйцо, желточный мешок, эмбрион, КТР",
        "Одноплодная vs многоплодная беременность на ранних сроках",
        "Нормальные и аномальные эхопризнаки 4–10 нед",
        "Критерии жизнеспособности и red flags",
      ],
      fileName: "Lecture-6-4-10.pdf",
      yandexDiskUrl: "https://disk.yandex.ru/i/HBUWonJavsL1DA",
    },
  ] satisfies BasicCourseLecture[],
} as const;

export function getBasicCourseLecture(id: string): BasicCourseLecture | undefined {
  return ISUOG_BASIC_COURSE.lectures.find((lecture) => lecture.id === id);
}

export function yandexDiskViewerUrl(publicUrl: string): string {
  return `https://disk.yandex.ru/iframe/i/${publicUrl.split("/i/")[1]?.split("?")[0] ?? ""}`;
}
