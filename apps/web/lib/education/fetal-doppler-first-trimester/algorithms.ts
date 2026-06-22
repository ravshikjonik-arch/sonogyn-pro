import type { FetalDopplerAlgorithm } from "./types";

export const FETAL_DOPPLER_ALGORITHMS: FetalDopplerAlgorithm[] = [
  {
    id: "extended-protocol",
    title: "Расширенный допплер-протокол 11–13+6",
    indication: "FMF extended first-trimester screening / SonoGyn-Pro FMF assistant",
    steps: [
      { step: 1, action: "Подтвердить жизнеспособность и базовую морфологию (КТР, ТВП, NT)." },
      { step: 2, action: "ALARA check", detail: "TI ≤ 1.0, color box minimal" },
      { step: 3, action: "Сердце: 4CV + 3VT color" },
      { step: 4, action: "Венозный проток: PI + A-wave", detail: "Правый парасагиттальный, sample ~1 mm" },
      { step: 5, action: "Пуповина: 2 артерии у пузыря", detail: "Поперечный таз, пузырь в кадре" },
      { step: 6, action: "Пупочное кольцо", branch: "Только при подозрении на АБП-дефект" },
      { step: 7, action: "Маточные артерии: PI R, L, mean", detail: "Угол < 30°, 3 цикла" },
      { step: 8, action: "Запись в протокол + FMF calculator" },
    ],
  },
  {
    id: "dv-troubleshooting",
    title: "Troubleshooting · венозный проток",
    indication: "Не удаётся получить стабильную кривую VP",
    steps: [
      { step: 1, action: "Color: проследить ПВ → VP → ПП" },
      { step: 2, action: "Уменьшить sample volume до ~1 mm" },
      { step: 3, action: "Исключить захват печёночных вен" },
      { step: 4, action: "Сменить доступ TV ↔ TA" },
      { step: 5, action: "Подождать период покоя плода" },
      { step: 6, action: "Если PI нестабилен — не усреднять артефакт; повторить позже" },
    ],
  },
  {
    id: "sua-pathway",
    title: "Путь при SUA",
    indication: "Идентифицирована единственная пупочная артерия",
    steps: [
      { step: 1, action: "Подтвердить на втором проходе с пузырём в кадре" },
      { step: 2, action: "Документировать 4CV/3VT" },
      { step: 3, action: "Расширенная анатомия по протоколу клиники" },
      { step: 4, action: "Генетическое консультирование / NIPT по показаниям" },
      { step: 5, action: "Контроль роста и допплер III триместра" },
    ],
  },
  {
    id: "pe-screening",
    title: "Скрининг ранней преэклампsии · PI маточных артерий",
    indication: "11–13+6, комбинированный PE risk assessment",
    steps: [
      { step: 1, action: "Сагиттальный срез: цервикальный канал + internal os" },
      { step: 2, action: "Color: uterine artery at internal os level" },
      { step: 3, action: "Pulsed Doppler: angle < 30°, SV 2 mm" },
      { step: 4, action: "3 consecutive waveforms → PI each side" },
      { step: 5, action: "Mean PI = (right + left) / 2" },
      { step: 6, action: "Внести в PE calculator с maternal factors" },
    ],
  },
  {
    id: "abdominal-wall-defect",
    title: "АБП-дефект · omphalocele vs gastroschisis",
    indication: "Подозрение на дефект передней брюшной стенки",
    steps: [
      { step: 1, action: "Проверить срок: до 11 нед — физиологическая грыжа возможна" },
      { step: 2, action: "Midline vs paraumbilical location" },
      { step: 3, action: "Membrane present? → omphalocele likely" },
      { step: 4, action: "Free loops without membrane → gastroschisis likely" },
      { step: 5, action: "Color: cord insertion site" },
      { step: 6, action: "Документировать после 12 нед для финального заключения" },
    ],
  },
];
