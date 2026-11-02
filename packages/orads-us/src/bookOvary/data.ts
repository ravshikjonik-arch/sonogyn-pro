import categoriesJson from "../../data/book-ovary/orads_categories.json";
import lexiconJson from "../../data/book-ovary/orads_lexicon.json";
import tumorCardsJson from "../../data/book-ovary/orads_tumor_cards.json";
import photocardsJson from "../../data/book-ovary/photocards.manifest.json";

import type {
  OradsBookCategoriesDocument,
  OradsBookLexiconDocument,
  OradsBookPhotocardsManifest,
  OradsBookTumorCardsDocument,
} from "./types";

export const ORADS_BOOK_LEXICON = lexiconJson as OradsBookLexiconDocument;
export const ORADS_BOOK_CATEGORIES = categoriesJson as OradsBookCategoriesDocument;
export const ORADS_BOOK_TUMOR_CARDS = tumorCardsJson as OradsBookTumorCardsDocument;
export const ORADS_BOOK_PHOTOCARDS = photocardsJson as OradsBookPhotocardsManifest;

export const ORADS_BOOK_DISCLAIMER_RU =
  "Справочник по методическому пособию (O-RADS US / ESGO–ISUOG–IOTA–ESGE). Не заменяет клиническое решение врача и не является диагнозом.";
