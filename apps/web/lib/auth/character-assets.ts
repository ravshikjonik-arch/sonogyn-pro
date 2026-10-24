import type { OnboardingCharacterId } from "@repo/types";

export type CharacterAssetSet = {
  hero: string;
  picker: string;
  labelRu: string;
  symbol: string;
};

export const CHARACTER_ASSETS: Record<OnboardingCharacterId, CharacterAssetSet> = {
  boy: {
    hero: "/auth/characters/man-hero.png",
    picker: "/auth/characters/man-picker.png",
    labelRu: "Я мужчина",
    symbol: "♂",
  },
  girl: {
    hero: "/auth/characters/woman-hero.png",
    picker: "/auth/characters/woman-picker.png",
    labelRu: "Я женщина",
    symbol: "♀",
  },
};

export const AUTH_DUO_BANNER_SRC = "/auth/characters/duo-banner.png";
