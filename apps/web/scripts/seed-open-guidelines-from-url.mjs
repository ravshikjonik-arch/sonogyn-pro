#!/usr/bin/env node
/**
 * B2: calm fill — allowlisted open PDFs → vault as review_required (optional --publish).
 * Uses the same text-layer extract as Source Studio URL import (unpdf).
 *
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --dry-run
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --apply
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --apply --publish
 *
 * Does not touch WHO NC. Skips URLs already present (external_url match).
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_TEXT = 200_000;
const MAX_CHUNK = 1800;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OPEN_TEXT = resolve(ROOT, "services/docling-ingest/open-text");

/** Curated open RAE sources (thyroid / US-adjacent). Prefer localText if PDF host times out. */
const CATALOG = [
  {
    title: "КР РАЭ: узловой зоб у взрослых (КР90)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2016,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr90_uzlovoy_zob_u_vzroslyh.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed. Перед publish: проверить актуальность редакции.",
    localText: "kr90_uzlovoy_zob.txt",
  },
  {
    title: "КР РАЭ: гипотиреоз у взрослых",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/568_gipotireoz_vzroslye.finalnaya.versiya.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed.",
    localText: "rae_gipotireoz.txt",
  },
  {
    title: "КР РАЭ: тиреотоксикоз (болезнь Грейвса / узловой зоб), 2021",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr_versiya_3.0_fin_otredaktirovan_16.05.2021g.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed.",
    localText: "rae_tireotoksikoz_2021.txt",
  },
  {
    title: "КР РАЭ: рак щитовидной железы (КР410)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2018,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr410.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2+/OCR-wave seed.",
    localText: "rae_kr410_thyroid_cancer.txt",
  },
  {
    title: "КР: гестационный сахарный диабет",
    organization: "РАЭ / НМИЦ эндокринологии",
    year: 2020,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/all/proektnyj_ofis_po_obespecheniyu_pacientov_s_saharnym_diabetom/klinicheskie_rekomendacii_gestacionnyj_saharnyy_diabet.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР (ГСД). B2+/OCR-wave seed.",
    localText: "rae_gestational_diabetes.txt",
  },
  {
    title: "КР РАЭ: первичная надпочечниковая недостаточность (КР524)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr524_pervichnaya_nadpochechnikovaya_nedostatochnost.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave.",
    localText: "rae_kr524_adrenal.txt",
  },
  {
    title: "КР РАЭ: остеопороз",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/osteoporoz.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave (text truncated to 200k if huge).",
    localText: "rae_osteoporoz.txt",
  },
  {
    title: "КР РАЭ: сахарный диабет 2 типа у взрослых",
    organization: "РАЭ / endocrincentr.ru",
    year: 2019,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/saharnyy_diabet_2_tipa_u_vzroslyh.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave (text truncated to 200k if huge).",
    localText: "rae_dm2_adults.txt",
  },
  {
    title: "КР МЗ РФ: миома матки (ID 257)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=257_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_myoma_257.txt",
  },
  {
    title: "КР МЗ РФ: аномальные маточные кровотечения (ID 645)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=645_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_amk_645.txt",
  },
  {
    title: "КР МЗ РФ: гиперплазия эндометрия (ID 646)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=646_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_endometrial_hyperplasia_646.txt",
  },
  {
    title: "КР МЗ РФ: воспалительные болезни женских тазовых органов (ID 643)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=643_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_pid_643.txt",
  },
  {
    title: "КР МЗ РФ: эндометриоз (ID 259)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=259_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ (ID 259, 2024). AG/US library fill.",
    localText: "mz_endometriosis_259.txt",
  },
  {
    title: "КР МЗ РФ: синдром поликистозных яичников (ID 258)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=258_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_pcos_258.txt",
  },
  {
    title: "КР МЗ РФ: внематочная (эктопическая) беременность (ID 642)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=642_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_ectopic_642.txt",
  },
  {
    title: "КР МЗ РФ: преэклампсия / эклампсия / гипертензивные расстройства (ID 637)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=637_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_preeclampsia_637.txt",
  },
  {
    title: "КР МЗ РФ: выкидыш (самопроизвольный аборт) (ID 670)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=670_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_miscarriage_670.txt",
  },
  {
    title: "КР МЗ РФ: нормальная беременность (ID 288)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=288_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_normal_pregnancy_288.txt",
  },
  {
    title: "КР МЗ РФ: преждевременные роды (ID 331)",
    organization: "РОАГ / МЗ РФ",
    year: 2020,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=331_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ (КР331). AG/US library fill.",
    localText: "mz_preterm_labor.txt",
  },
  {
    title: "КР МЗ РФ: патологическое прикрепление плаценты (ID 767)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=767_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_placenta_previa_767.txt",
  },
  {
    title: "КР МЗ РФ: задержка роста плода (ID 722)",
    organization: "РОАГ / МЗ РФ",
    year: 2022,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=722_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_fgr_722.txt",
  },
  {
    title: "КР МЗ РФ: доброкачественные новообразования яичников (ID 984)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=984_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР (O-RADS/IOTA упоминания). AG/US library fill.",
    localText: "mz_benign_ovarian_984.txt",
  },
  {
    title: "КР МЗ РФ: истмико-цервикальная недостаточность (ID 671)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=671_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_icin_671.txt",
  },
  {
    title: "КР МЗ РФ: многоплодная беременность (ID 638)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=638_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_multiple_pregnancy_638.txt",
  },
  {
    title: "КР МЗ РФ: неэпителиальные опухоли яичников (ID 541)",
    organization: "РОАГ / МЗ РФ / онкология",
    year: 2020,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=541_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. Диффдиагноз образований яичников.",
    localText: "mz_nonepithelial_ovary_541.txt",
  },
  {
    title: "КР МЗ РФ: роды одноплодные, кесарево сечение (ID 639)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=639_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_cesarean_639.txt",
  },
  {
    title: "КР МЗ РФ: подготовка шейки матки к родам и родовозбуждение (ID 640)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=640_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_induction_640.txt",
  },
  {
    title: "КР МЗ РФ: женское бесплодие (ID 641)",
    organization: "РОАГ / РАРЧ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=641_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_infertility_641.txt",
  },
  {
    title: "КР МЗ РФ: послеродовое кровотечение (ID 119)",
    organization: "РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=119_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_pph_119.txt",
  },
  {
    title: "КР МЗ РФ: резус-изоиммунизация / ГБП (ID 596)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=596_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill (MCA-PSV).",
    localText: "mz_rh_596.txt",
  },
  {
    title: "КР МЗ РФ: нормальные роды / затылочное предлежание (ID 636)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=636_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_normal_labor_636.txt",
  },
  {
    title: "КР МЗ РФ: менопауза и климактерическое состояние (ID 117)",
    organization: "РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=117_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_menopause_117.txt",
  },
  {
    title: "КР МЗ РФ: железодефицитная анемия (ID 669)",
    organization: "НГО / РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=669_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР (вкл. O99.0 беременность). Library fill.",
    localText: "mz_ida_669.txt",
  },
  {
    title: "КР МЗ РФ: выпадение женских половых органов (ID 647)",
    organization: "РОАГ / РОУ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=647_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_prolapse_647.txt",
  },
  {
    title: "КР МЗ РФ: CIN / эрозия и эктропион шейки матки (ID 597)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=597_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cin_597.txt",
  },
  {
    title: "КР МЗ РФ: доброкачественная дисплазия молочной железы (ID 598)",
    organization: "РОАГ / РАМ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=598_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР (BI-RADS/УЗИ МЖ). AG/US library fill.",
    localText: "mz_benign_breast_598.txt",
  },
  {
    title: "КР МЗ РФ: привычный выкидыш (ID 721)",
    organization: "РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=721_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_recurrent_miscarriage_721.txt",
  },
  {
    title: "КР МЗ РФ: тазовое предлежание плода (ID 626)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=626_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_breech_626.txt",
  },
  {
    title: "КР МЗ РФ: дистоция плечиков (ID 595)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=595_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_shoulder_dystocia_595.txt",
  },
  {
    title: "КР МЗ РФ: гестационный сахарный диабет (ID 841)",
    organization: "РАЭ / РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=841_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ (актуальная редакция ГСД).",
    localText: "mz_gsd_841.txt",
  },
  {
    title: "КР МЗ РФ: хориоамнионит / инфекции амниотической полости (ID 776)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=776_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_chorioamnionitis_776.txt",
  },
  {
    title: "КР МЗ РФ: преждевременная отслойка плаценты (ID 800)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=800_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_abruption_800.txt",
  },
  {
    title: "КР МЗ РФ: инфекция мочевых путей при беременности (ID 719)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=719_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_uti_pregnancy_719.txt",
  },
  {
    title: "КР МЗ РФ: послеродовые инфекционные осложнения (ID 791)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=791_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_postpartum_infection_791.txt",
  },
  {
    title: "КР МЗ РФ: аменорея и олигоменорея (ID 644)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=644_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_amenorrhea_644.txt",
  },
  {
    title: "КР МЗ РФ: аномалии объема амниотической жидкости (ID 820)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=820_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР (ИАЖ/МВК). AG/US library fill.",
    localText: "mz_amniotic_fluid_820.txt",
  },
  {
    title: "КР МЗ РФ: акушерская тромбоэмболия / ВТЭО (ID 723)",
    organization: "РОАГ / АААР / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=723_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_vte_723.txt",
  },
  {
    title: "КР МЗ РФ: дисменорея (ID 833)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=833_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_dysmenorrhea_833.txt",
  },
  {
    title: "КР МЗ РФ: чрезмерная рвота беременных (ID 802)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=802_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_hyperemesis_802.txt",
  },
  {
    title: "КР МЗ РФ: аномалии родовой деятельности (ID 822)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=822_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_labor_anomalies_822.txt",
  },
  {
    title: "КР МЗ РФ: трофобластические опухоли / пузырный занос (ID 80)",
    organization: "РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=80_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_trophoblastic_80.txt",
  },
  {
    title: "КР МЗ РФ: полипы эндометрия (ID 764)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=764_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_endometrial_polyps_764.txt",
  },
  {
    title: "КР МЗ РФ: внутрипеченочный холестаз при беременности (ID 289)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=289_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cholestasis_289.txt",
  },
  {
    title: "КР МЗ РФ: нормальный послеродовый период (ID 799)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=799_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_postpartum_normal_799.txt",
  },
  {
    title: "КР МЗ РФ: оперативные влагалищные роды (ID 775)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=775_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_operative_vaginal_775.txt",
  },
  {
    title: "КР МЗ РФ: ВИЧ-инфекция у беременных (ID 717)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=717_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_hiv_pregnancy_717.txt",
  },
  {
    title: "КР МЗ РФ: синдром гиперстимуляции яичников (ID 665)",
    organization: "РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=665_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_ohss_665.txt",
  },
  {
    title: "КР МЗ РФ: послеоперационный рубец на матке (ID 635)",
    organization: "РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=635_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_uterine_scar_635.txt",
  },
  {
    title: "КР МЗ РФ: несоответствие размеров таза и плода / разгибательные предлежания (ID 766)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=766_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cpd_766.txt",
  },
  {
    title: "КР МЗ РФ: признаки внутриутробной гипоксии плода (ID 774)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=774_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG/US library fill.",
    localText: "mz_fetal_hypoxia_774.txt",
  },
  {
    title: "КР МЗ РФ: акушерский травматизм / разрывы промежности (ID 768)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=768_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_obstetric_trauma_768.txt",
  },
  {
    title: "КР МЗ РФ: эмболия амниотической жидкостью (ID 720)",
    organization: "РОАГ / ААР / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=720_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_afe_720.txt",
  },
  {
    title: "КР МЗ РФ: бактериальный вагиноз (ID 206)",
    organization: "РОДВК / МЗ РФ",
    year: 2022,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=206_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_bv_206.txt",
  },
  {
    title: "КР МЗ РФ: болезни бартолиновой железы (ID 765)",
    organization: "РОАГ / МЗ РФ",
    year: 2023,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=765_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_bartholin_765.txt",
  },
  {
    title: "КР МЗ РФ: хламидийная инфекция (ID 194)",
    organization: "РОДВК / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=194_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_chlamydia_194.txt",
  },
  {
    title: "КР МЗ РФ: урогенитальный трихомониаз (ID 241)",
    organization: "РОДВК / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=241_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_trichomoniasis_241.txt",
  },
  {
    title: "КР МЗ РФ: гонококковая инфекция (ID 218)",
    organization: "РОДВК / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=218_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_gonorrhea_218.txt",
  },
  {
    title: "КР МЗ РФ: аногенитальная герпетическая вирусная инфекция (ID 679)",
    organization: "РОДВК / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=679_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_genital_herpes_679.txt",
  },
  {
    title: "КР МЗ РФ: аногенитальные (венерические) бородавки (ID 204)",
    organization: "РОДВК / АКР / РОАГ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=204_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_anogenital_warts_204.txt",
  },
  {
    title: "КР МЗ РФ: урогенитальные заболевания, вызванные Mycoplasma genitalium (ID 216)",
    organization: "РОДВК / РОАГ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=216_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_mycoplasma_216.txt",
  },
  {
    title: "КР МЗ РФ: сифилис (ID 197)",
    organization: "РОДВК / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=197_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_syphilis_197.txt",
  },
  {
    title: "КР МЗ РФ: цистит у женщин (ID 14)",
    organization: "РОУ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=14_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cystitis_14.txt",
  },
  {
    title: "КР МЗ РФ: ректоцеле (ID 188)",
    organization: "АКР / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=188_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_rectocele_188.txt",
  },
  {
    title: "КР МЗ РФ: ректовагинальный свищ (ID 187)",
    organization: "АКР / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=187_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_rectovaginal_fistula_187.txt",
  },
  {
    title: "КР МЗ РФ: рак шейки матки (ID 537)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=537_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cervical_cancer_537.txt",
  },
  {
    title: "КР МЗ РФ: рак тела матки и саркомы матки (ID 460)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=460_4&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_endometrial_cancer_460.txt",
  },
  {
    title: "КР МЗ РФ: рак яичников / маточной трубы / первичный рак брюшины (ID 547)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=547_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_ovarian_cancer_547.txt",
  },
  {
    title: "КР МЗ РФ: рак вульвы (ID 501)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=501_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_vulvar_cancer_501.txt",
  },
  {
    title: "КР МЗ РФ: рак молочной железы (ID 379)",
    organization: "АОР / RUSSCO / РООМ / МЗ РФ",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=379_4&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_breast_cancer_379.txt",
  },
  {
    title: "КР МЗ РФ: пограничные опухоли яичников (ID 346)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=346_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_borderline_ovarian_346.txt",
  },
  {
    title: "КР МЗ РФ: воспалительные болезни шейки матки, влагалища и вульвы (ID 989)",
    organization: "РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=989_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cervicitis_vaginitis_989.txt",
  },
  {
    title: "КР МЗ РФ: злокачественные новообразования влагалища (ID 344)",
    organization: "АОР / RUSSCO / РОСПТОРС / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=344_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_vaginal_cancer_344.txt",
  },
  {
    title: "КР МЗ РФ: врожденная цитомегаловирусная инфекция (ID 260)",
    organization: "РОН / АСПМ / МЗ РФ",
    year: 2026,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=260_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cmv_congenital_260.txt",
  },
  {
    title: "КР МЗ РФ: фолиеводефицитная анемия (ID 540)",
    organization: "НГО / РОДОГ / РНМОТ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=540_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_folate_anemia_540.txt",
  },
  {
    title: "КР МЗ РФ: гипотиреоз (ID 531)",
    organization: "РАЭ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=531_4&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_hypothyroidism_531.txt",
  },
  {
    title: "КР МЗ РФ: остеопороз (ID 87)",
    organization: "РАЭ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=87_5&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_osteoporosis_87.txt",
  },
  {
    title: "КР МЗ РФ: сахарный диабет 2 типа у взрослых (ID 290)",
    organization: "РАЭ / МЗ РФ",
    year: 2022,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=290_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_dm2_290.txt",
  },
  {
    title: "КР МЗ РФ: артериальная гипертензия у взрослых (ID 62)",
    organization: "РКО / РНМОТ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=62_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_hypertension_62.txt",
  },
  {
    title: "КР МЗ РФ: первичный гиперпаратиреоз (ID 88)",
    organization: "РАЭ / АЭХ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=88_5&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_hyperparathyroidism_88.txt",
  },
  {
    title: "КР МЗ РФ: сахарный диабет 1 типа у взрослых (ID 286)",
    organization: "РАЭ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=286_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_dm1_286.txt",
  },
  {
    title: "КР МЗ РФ: врожденная дисфункция коры надпочечников / адреногенитальный синдром (ID 82)",
    organization: "РАЭ / РОАГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=82_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_cah_82.txt",
  },
  {
    title: "КР МЗ РФ: сахарный диабет — ретинопатия и макулярный отек (ID 115)",
    organization: "АВО / РАЭ / МЗ РФ",
    year: 2026,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=115_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_diabetic_retinopathy_115.txt",
  },
  {
    title: "КР МЗ РФ: первичная надпочечниковая недостаточность (ID 524)",
    organization: "РАЭ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=524_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_adrenal_insufficiency_524.txt",
  },
  {
    title: "КР МЗ РФ: рак коры надпочечника / адренокортикальный рак (ID 341)",
    organization: "РАЭ / АОР / АЭХ / РОДОГ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=341_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_adrenal_cancer_341.txt",
  },
  {
    title: "КР МЗ РФ: легочная гипертензия, в т.ч. ХТЭЛГ (ID 159)",
    organization: "РКО / АССХ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=159_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_pah_159.txt",
  },
  {
    title: "КР МЗ РФ: холецистит (ID 819; supersedes 324)",
    organization: "РОХ / РГА / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=819_1&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill (актуальная вместо 324).",
    localText: "mz_cholecystitis_819.txt",
  },
  {
    title: "КР МЗ РФ: тиреотоксикоз / болезнь Грейвса, токсический зоб (ID 270)",
    organization: "РАЭ / МЗ РФ",
    year: 2025,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=270_2&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_thyrotoxicosis_270.txt",
  },
  {
    title: "КР МЗ РФ: ожирение у взрослых (ID 28)",
    organization: "РАЭ / Общество бариатрических хирургов / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=28_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill.",
    localText: "mz_obesity_28.txt",
  },
  {
    title: "КР МЗ РФ: заболевания и состояния, связанные с дефицитом йода (ID 620)",
    organization: "РАЭ / МЗ РФ",
    year: 2024,
    source_type: "guideline",
    language: "ru",
    external_url: "https://apicr.minzdrav.gov.ru/api.ashx?id=620_3&op=GetClinrecPdf",
    copyright_status: "official_kr_mz_rf",
    license_notes: "Официальная КР рубрикатора МЗ РФ. AG library fill (узловой зоб / EU-TIRADS).",
    localText: "mz_iodine_deficiency_620.txt",
  },
];

function hash(s) {
  return createHash("sha256").update(s).digest("hex");
}

function splitOversized(content, section) {
  const parts = [];
  let rest = content.trim();
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf("\n", MAX_CHUNK);
    if (cut < MAX_CHUNK * 0.4) cut = rest.lastIndexOf(" ", MAX_CHUNK);
    if (cut < MAX_CHUNK * 0.4) cut = MAX_CHUNK;
    parts.push({ sectionTitle: section, content: rest.slice(0, cut).trim() });
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push({ sectionTitle: section, content: rest });
  return parts;
}

function chunkPlainText(raw) {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  let buf = "";
  let section = null;
  const flush = () => {
    const content = buf.trim();
    if (!content) return;
    for (const piece of splitOversized(content, section)) {
      out.push({ chunkIndex: out.length, sectionTitle: piece.sectionTitle, content: piece.content });
    }
    buf = "";
  };
  for (const block of blocks) {
    if (buf.length + block.length + 2 > MAX_CHUNK) flush();
    buf = buf ? `${buf}\n\n${block}` : block;
  }
  flush();
  return out;
}

function lightSanitize(text) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function pdfToText(bytes) {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n\n") : String(text ?? "");
  return lightSanitize(joined).slice(0, MAX_TEXT);
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  const publish = process.argv.includes("--publish");
  if (!dry && !apply) {
    console.error("Укажите --dry-run или --apply");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "найдено" : "отсутствует");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", key ? "найдено" : "отсутствует");
  if (!url || !key) process.exit(1);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const item of CATALOG) {
    console.log("\n—", item.title);
    const { data: existing } = await supabase
      .from("sources")
      .select("id,review_status,rag_allowed")
      .eq("external_url", item.external_url)
      .maybeSingle();
    if (existing) {
      console.log("  already:", existing.id, existing.review_status, "rag=", existing.rag_allowed);
      if (apply && publish && existing.review_status !== "published") {
        await publishSource(supabase, existing.id);
      }
      continue;
    }

    if (dry) {
      console.log("  dry-run: would fetch + insert review_required");
      continue;
    }

    let text = "";
    const localPath = item.localText ? resolve(OPEN_TEXT, item.localText) : null;
    if (localPath && existsSync(localPath)) {
      text = lightSanitize(readFileSync(localPath, "utf8")).slice(0, MAX_TEXT);
      console.log("  local text", item.localText, "chars", text.length);
    } else {
      let buf;
      try {
        const res = await fetch(item.external_url, {
          redirect: "follow",
          signal: AbortSignal.timeout(120_000),
          headers: { "User-Agent": "SonoGynPro-VaultIngest/1.0", Accept: "application/pdf" },
        });
        if (!res.ok) {
          console.log("  fetch fail", res.status);
          continue;
        }
        buf = new Uint8Array(await res.arrayBuffer());
      } catch (e) {
        console.log("  fetch error", e instanceof Error ? e.message : e);
        continue;
      }
      if (buf.byteLength > MAX_BYTES) {
        console.log("  too large", buf.byteLength);
        continue;
      }
      text = await pdfToText(buf);
    }
    if (text.length < 80) {
      console.log("  no text layer / too short", text.length);
      continue;
    }
    const chunks = chunkPlainText(text);
    console.log("  chars", text.length, "chunks", chunks.length);

    const { data: source, error: sErr } = await supabase
      .from("sources")
      .insert({
        title: item.title,
        organization: item.organization,
        year: item.year,
        source_type: item.source_type,
        language: item.language,
        external_url: item.external_url,
        copyright_status: item.copyright_status,
        license_notes: item.license_notes,
        rag_allowed: false,
        quotation_allowed: true,
        review_status: "review_required",
        version: "1.0.0",
      })
      .select("id")
      .single();
    if (sErr || !source) {
      console.log("  source error", sErr?.message);
      continue;
    }

    const rows = chunks.map((c) => ({
      source_id: source.id,
      section_title: c.sectionTitle,
      chunk_index: c.chunkIndex,
      content: c.content,
      sanitized_content: c.content,
      content_hash: hash(c.content),
      token_count: Math.ceil(c.content.length / 4),
      review_status: "review_required",
    }));
    const { error: cErr } = await supabase.from("source_chunks").insert(rows);
    if (cErr) {
      console.log("  chunks error", cErr.message, "source", source.id);
      continue;
    }
    console.log("  inserted", source.id, "chunks", rows.length);

    if (publish) {
      await publishSource(supabase, source.id);
    }
  }
  console.log("\nDone.");
}

async function publishSource(supabase, sourceId) {
  const { data: src } = await supabase.from("sources").select("id,version").eq("id", sourceId).single();
  if (!src) return;
  const { error: rErr } = await supabase.from("medical_reviews").insert({
    entity_type: "source",
    entity_id: sourceId,
    status: "approved",
    notes: "B2 seed: open RAE guideline URL import",
    reviewed_at: new Date().toISOString(),
    source_version: src.version || "1.0.0",
  });
  if (rErr && !/duplicate|unique/i.test(rErr.message)) {
    console.log("  review error", rErr.message);
    return;
  }
  const { error: uErr } = await supabase
    .from("sources")
    .update({
      review_status: "published",
      rag_allowed: true,
      quotation_allowed: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
  if (uErr) {
    console.log("  publish source error", uErr.message);
    return;
  }
  await supabase
    .from("source_chunks")
    .update({ review_status: "published" })
    .eq("source_id", sourceId);
  console.log("  published", sourceId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
