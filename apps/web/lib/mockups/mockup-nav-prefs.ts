export type MockupId = "uterus" | "breast" | "ovary";

export type MockupNavPrefs = {
  /** Порядок ссылок в боковом меню */
  sidebarOrder: MockupId[];
  /** Стартовый макет на странице /mockups */
  defaultMockup: MockupId;
};

const STORAGE_KEY = "sonogyn-mockup-nav-prefs";

export const MOCKUP_ROUTES: Record<
  MockupId,
  { href: string; label: string; description: string }
> = {
  uterus: {
    href: "/uterus-3d",
    label: "Макет матки",
    description: "Коронарный разрез и сагиттальный срез · FIGO · текст в протокол",
  },
  breast: {
    href: "/breast-3d",
    label: "Макет МЖ",
    description: "Топография обеих грудей · часы, квадрант, см от соска · BI-RADS",
  },
  ovary: {
    href: "/ovary-atlas",
    label: "Макет яичника",
    description: "Увеличенный яичник · фолликулы, кисты · ИИ по фото/видео · O-RADS",
  },
};

const DEFAULT_ORDER: MockupId[] = ["uterus", "ovary", "breast"];

const DEFAULT_PREFS: MockupNavPrefs = {
  sidebarOrder: DEFAULT_ORDER,
  defaultMockup: "uterus",
};

export function readMockupNavPrefs(): MockupNavPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<MockupNavPrefs>;
    const order = parsed.sidebarOrder;
    const validSet = (order ?? []).filter((id): id is MockupId =>
      id === "uterus" || id === "breast" || id === "ovary",
    );
    const validOrder =
      validSet.length === DEFAULT_ORDER.length && new Set(validSet).size === DEFAULT_ORDER.length
        ? validSet
        : DEFAULT_PREFS.sidebarOrder;
    const defaultMockup: MockupId =
      parsed.defaultMockup === "breast" || parsed.defaultMockup === "ovary"
        ? parsed.defaultMockup
        : "uterus";
    return { sidebarOrder: validOrder, defaultMockup };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveMockupNavPrefs(prefs: MockupNavPrefs) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function swapMockupSidebarOrder(prefs: MockupNavPrefs): MockupNavPrefs {
  const [first, ...rest] = prefs.sidebarOrder;
  const next: MockupNavPrefs = {
    ...prefs,
    sidebarOrder: [...rest, first],
  };
  saveMockupNavPrefs(next);
  return next;
}
