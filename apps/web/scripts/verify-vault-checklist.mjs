#!/usr/bin/env node
/**
 * Independent vault verify against docs/audit/VAULT_VERIFY_CHECKLIST.md
 * Usage:
 *   node --env-file=apps/web/.env.local apps/web/scripts/verify-vault-checklist.mjs
 * Prints status only (no secrets / PHI).
 *
 * Note: product path also applies phrase hints + title re-rank in
 * @repo/evidence-retrieval (searchMedicalVault). This script smoke-tests RPC + flags.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const vaultOn = Boolean(process.env.EVIDENCE_MEDICAL_VAULT?.trim().match(/^(1|true|on)$/i));
const ftsOn = Boolean(process.env.EVIDENCE_MEDICAL_VAULT_FTS?.trim().match(/^(1|true|on)$/i));

const QUERIES = [
  { n: 1, q: "EU-TIRADS 5", expect: /ETA|TIRADS|узлов/i },
  { n: 2, q: "миома матки УЗИ трансвагинальное", expect: /257|миома/i },
  { n: 3, q: "эндометриоз УЗИ малого таза", expect: /259|эндометриоз/i },
  { n: 4, q: "внематочная беременность β-ХГЧ", expect: /642|внематочн|эктопическ/i },
  { n: 5, q: "угрожающий выкидыш КТР", expect: /670|выкидыш|аборт/i },
  { n: 6, q: "задержка роста плода процентиль ОЖ", expect: /722|задержка роста|ЗРП/i },
  { n: 7, q: "предлежание плаценты 20 мм", expect: /767|предлежание|плацент/i },
  { n: 8, q: "цервикометрия преждевременные роды", expect: /331|преждевременн|цервикометр/i },
  { n: 9, q: "гестационный диабет глюкоза 5.1", expect: /841|гестационн|ГСД|диабет/i },
  { n: 10, q: "правила УЗИ приказ 557н", expect: /557/i },
  { n: 11, q: "истмико-цервикальная недостаточность серкляж", expect: /671|истмико|ИЦН|серкляж/i },
  { n: 12, q: "многоплодная беременность хориальность УЗИ", expect: /638|многоплод|хориальн/i },
  { n: 13, q: "образование яичника O-RADS IOTA", expect: /984|яичник|O-RADS|IOTA/i },
  { n: 14, q: "неэпителиальная опухоль яичника", expect: /541|неэпителиальн/i },
  { n: 15, q: "показания к кесареву сечению категории неотложности", expect: /639|кесарев/i },
  { n: 16, q: "индукция родов шкала Бишоп мифепристон", expect: /640|родовозбужден|Бишоп|мифепристон/i },
  { n: 17, q: "женское бесплодие 12 месяцев диагностика", expect: /641|бесплод/i },
  { n: 18, q: "послеродовое кровотечение 500 мл окситоцин", expect: /119|послеродов.*кровотеч|окситоцин/i },
  { n: 19, q: "резус-изоиммунизация MCA-PSV профилактика анти-D", expect: /596|резус|изоиммун|анти-D|MCA/i },
  { n: 20, q: "нормальные роды затылочное предлежание III период", expect: /636|нормальн.*род|затылочн/i },
  { n: 21, q: "менопауза 12 месяцев аменореи МГТ", expect: /117|менопауз|климактер/i },
  { n: 22, q: "железодефицитная анемия беременность гемоглобин 110", expect: /669|железодефицит|анеми/i },
  { n: 23, q: "пролапс тазовых органов цистоцеле", expect: /647|пролапс|выпадение|цистоцеле/i },
  { n: 24, q: "CIN II-III ВПЧ кольпоскопия", expect: /597|CIN|неоплази|эктропион|шейк/i },
  { n: 25, q: "мастопатия BI-RADS УЗИ молочных желез", expect: /598|мастопат|дисплази.*молоч|BI-RADS/i },
  { n: 26, q: "привычный выкидыш 2 потери до 22 недель", expect: /721|привычн.*выкидыш|невынаш/i },
  { n: 27, q: "тазовое предлежание наружный поворот", expect: /626|тазов.*предлеж/i },
  { n: 28, q: "дистоция плечиков McRoberts", expect: /595|дистоци|плечик/i },
  { n: 29, q: "гестационный сахарный диабет глюкоза 5.1 ПГТТ", expect: /841|гестационн.*диабет|ГСД/i },
  { n: 30, q: "хориоамнионит лихорадка 38 тахикардия плода", expect: /776|хориоамнионит/i },
  { n: 31, q: "преждевременная отслойка плаценты кровотечение", expect: /800|отслойк/i },
  { n: 32, q: "инфекция мочевых путей беременность бессимптомная бактериурия", expect: /719|мочев|бактериури/i },
  { n: 33, q: "послеродовой эндометрит лихорадка", expect: /791|послеродов.*инфек|эндометрит/i },
  { n: 34, q: "аменорея вторичная обследование", expect: /644|аменоре/i },
  { n: 35, q: "маловодие ИАЖ 5 см МВК 2 см", expect: /820|амниотическ|маловоди|ИАЖ|МВК/i },
  { n: 36, q: "тромбопрофилактика НМГ беременность", expect: /723|тромбо|ВТЭО|НМГ/i },
  { n: 37, q: "первичная дисменорея НПВС", expect: /833|дисменоре/i },
  { n: 38, q: "чрезмерная рвота беременных потеря веса 5%", expect: /802|рвота беремен|гиперэмезис/i },
  { n: 39, q: "аномалии родовой деятельности слабость схваток окситоцин", expect: /822|аномал.*родов|слабость родовой/i },
  { n: 40, q: "пузырный занос β-ХГЧ УЗИ трофобластическая", expect: /80|пузырн.*занос|трофобласт/i },
  { n: 41, q: "полип эндометрия гистероскопия УЗИ", expect: /764|полип.*эндометр/i },
  { n: 42, q: "внутрипеченочный холестаз беременность зуд желчные кислоты", expect: /289|холестаз|ВХБ/i },
  { n: 43, q: "нормальный послеродовый период осмотр родильницы", expect: /799|послеродов/i },
  { n: 44, q: "вакуум-экстракция плода акушерские щипцы", expect: /775|вакуум|щипц/i },
  { n: 45, q: "ВИЧ беременность антиретровирусная терапия", expect: /717|ВИЧ|антиретровирус/i },
  { n: 46, q: "синдром гиперстимуляции яичников асцит ВРТ", expect: /665|гиперстимул|СГЯ/i },
  { n: 47, q: "рубец на матке после кесарева VBAC толщина 2.5 мм", expect: /635|рубец|VBAC|кесарев/i },
  { n: 48, q: "клинически узкий таз лицевое предлежание", expect: /766|узк.*таз|лицево|несоответств/i },
  { n: 49, q: "гипоксия плода КТГ дистресс шевеления", expect: /774|гипокси|дистресс|КТГ/i },
  { n: 50, q: "разрыв промежности III степени эпизиотомия", expect: /768|промежност|эпизиотом|травматизм/i },
  { n: 51, q: "эмболия амниотической жидкостью шок ДВС", expect: /720|эмболи.*амниот|ЭАЖ|ДВС/i },
  { n: 52, q: "бактериальный вагиноз ключевые клетки метронидазол", expect: /206|вагиноз|БВ|метронидазол/i },
  { n: 53, q: "киста бартолиновой железы абсцесс", expect: /765|бартолин/i },
  { n: 54, q: "хламидийная инфекция ПЦР доксициклин", expect: /194|хламид|доксициклин/i },
  { n: 55, q: "урогенитальный трихомониаз метронидазол", expect: /241|трихомон|метронидазол/i },
  { n: 56, q: "гонококковая инфекция цефтриаксон", expect: /218|гонокок|гоноре|цефтриаксон/i },
  { n: 57, q: "аногенитальный герпес ацикловир", expect: /679|герпес|ацикловир/i },
  { n: 58, q: "аногенитальные бородавки кондиломы ВПЧ", expect: /204|бородавк|кондилом|ВПЧ/i },
  { n: 59, q: "Mycoplasma genitalium доксициклин азитромицин", expect: /216|Mycoplasma|микоплазм|доксициклин|азитромицин/i },
  { n: 60, q: "сифилис Treponema бензилпенициллин", expect: /197|сифилис|Treponema|пенициллин/i },
  { n: 61, q: "цистит у женщин дизурия фосфомицин", expect: /14|цистит|дизури|фосфомицин/i },
  { n: 62, q: "ректоцеле дефекография кольпоперинеоррафия", expect: /188|ректоцеле|дефекограф/i },
  { n: 63, q: "ректовагинальный свищ колопроктолог", expect: /187|ректовагинальн|свищ/i },
  { n: 64, q: "рак шейки матки ВПЧ 16 18 FIGO", expect: /537|рак шейки|РШМ|ВПЧ|FIGO/i },
  { n: 65, q: "рак тела матки эндометрий саркома", expect: /460|рак тела|эндометр.*рак|сарком/i },
  { n: 66, q: "рак яичников СА125 циторедукция", expect: /547|рак яичник|СА.?125|циторедук/i },
  { n: 67, q: "рак вульвы биопсия паховые лимфоузлы", expect: /501|рак вульв|пахов/i },
  { n: 68, q: "рак молочной железы BI-RADS BRCA", expect: /379|рак молочн|РМЖ|BRCA|BI-RADS/i },
  { n: 69, q: "пограничные опухоли яичников органосохраняющее", expect: /346|пограничн|ПОЯ/i },
  { n: 70, q: "кандидозный вульвовагинит творожистые выделения", expect: /989|кандид|вульвовагинит|КВВ/i },
  { n: 71, q: "рак влагалища ВПЧ лучевая терапия", expect: /344|влагалищ|РВл/i },
  { n: 72, q: "врожденная цитомегаловирусная инфекция ганцикловир", expect: /260|цитомегалов|ЦМВ|ганцикловир/i },
  { n: 73, q: "фолиеводефицитная анемия макроцитоз фолаты", expect: /540|фолиев|макроцит|фолат/i },
  { n: 74, q: "гипотиреоз ТТГ левотироксин", expect: /531|гипотиреоз|левотироксин|ТТГ/i },
  { n: 75, q: "остеопороз FRAX постменопауза", expect: /87|остеопороз|FRAX|постменопауз/i },
  { n: 76, q: "сахарный диабет 2 типа метформин HbA1c", expect: /290|диабет 2|СД 2|метформин|HbA1c/i },
  { n: 77, q: "артериальная гипертензия АД 140 СМАД", expect: /62|гипертенз|АГ|СМАД/i },
  { n: 78, q: "первичный гиперпаратиреоз ПТГ кальций", expect: /88|гиперпаратиреоз|ПТГ|ПГПТ/i },
  { n: 79, q: "сахарный диабет 1 типа инсулин GAD", expect: /286|диабет 1|СД 1|инсулин|GAD/i },
  { n: 80, q: "адреногенитальный синдром 17-ОНП ВДКН", expect: /82|адреногенитал|ВДКН|17.?ОНП/i },
  { n: 81, q: "диабетическая ретинопатия макулярный отек", expect: /115|ретинопат|макулярн|ДМО/i },
  { n: 82, q: "первичная надпочечниковая недостаточность Аддисон", expect: /524|надпочечников|Аддисон|1-НН/i },
  { n: 83, q: "адренокортикальный рак митотан", expect: /341|адренокортикальн|АКР|митотан/i },
  { n: 84, q: "легочная артериальная гипертензия срДЛА ХТЭЛГ", expect: /159|легочн.*гипертенз|ЛАГ|ХТЭЛГ|срДЛА/i },
  { n: 85, q: "острый холецистит УЗИ холецистэктомия", expect: /819|холецистит|холецистэктоми/i },
  { n: 86, q: "тиреотоксикоз болезнь Грейвса тиамазол", expect: /270|тиреотоксикоз|Грейвс|тиамазол/i },
  { n: 87, q: "ожирение ИМТ бариатрическая хирургия", expect: /28|ожирен|бариатр|ИМТ/i },
  { n: 88, q: "узловой зоб EU-TIRADS дефицит йода", expect: /620|узлов.*зоб|EU.?TIRADS|йод/i },
  { n: 89, q: "гиперпролактинемия пролактинома каберголин", expect: /85|гиперпролактинем|пролактином|каберголин/i },
  { n: 90, q: "болезнь Иценко-Кушинга кортизол дексаметазон", expect: /84|Кушинг|Иценко|кортизол|БИК/i },
  { n: 91, q: "подострый тиреоидит боль шея", expect: /621|тиреоидит|подостр/i },
  { n: 92, q: "амиодарон тиреотоксикоз АиТ", expect: /805|амиодарон|АиТ/i },
  { n: 93, q: "гипопаратиреоз гипокальциемия ПТГ", expect: /627|гипопаратиреоз|гипокальцием|ПТГ/i },
  { n: 94, q: "акромегалия ИФР-1 соматостатин", expect: /81|акромегали|ИФР|соматостатин/i },
  { n: 95, q: "инциденталома надпочечника дексаметазон 1 мг", expect: /инциденталом|надпочечник|дексаметазон/i },
  { n: 96, q: "феохромоцитома метанефрин альфа-блокатор", expect: /610|феохромоцитом|метанефрин|ФХЦ/i },
  { n: 97, q: "дифференцированный рак щитовидной железы тиреоидэктомия", expect: /329|дифференцированн|РЩЖ|тиреоидэктоми/i },
  { n: 98, q: "СКВ беременность гидроксихлорохин АФС", expect: /484|волчанк|СКВ|гидроксихлорохин|АФС/i },
  { n: 99, q: "медуллярный рак щитовидной железы кальцитонин RET", expect: /332|медуллярн|кальцитон|RET/i },
  { n: 100, q: "хронический гепатит B беременность HBsAg", expect: /900|гепатит B|HBsAg|HBV/i },
  { n: 101, q: "диффузный токсический зоб дети тиамазол", expect: /1055|токсическ.*зоб|Грейвс|тиамазол|дети/i },
  { n: 102, q: "хронический гепатит C беременность ВГС", expect: /516|гепатит C|ВГС|HCV/i },
  { n: 103, q: "врожденный гипотиреоз неонатальный скрининг ТТГ", expect: /712|врожденн.*гипотиреоз|неонатальн|скрининг/i },
  { n: 104, q: "гипопитуитаризм дефицит СТГ SDS роста", expect: /1062|гипопитуитаризм|СТГ|соматотроп/i },
  { n: 105, q: "эпилепсия беременность вальпроевая кислота", expect: /741|эпилепси|вальпро|ПЭП|беремен/i },
  { n: 106, q: "гипогонадизм мужчины СД тестостерон", expect: /33|гипогонадизм|тестостерон/i },
  { n: 107, q: "здоровый новорожденный скрининг стационар", expect: /924|новорожден|скрининг/i },
  { n: 108, q: "бронхиальная астма беременность ИГКС", expect: /359|астм|ИГКС|беремен/i },
  { n: 109, q: "ИТП беременность тромбоциты ВВИГ", expect: /150|ИТП|тромбоцитопен|ВВИГ/i },
  { n: 110, q: "ССЗ беременность мВОЗ ЭхоКГ", expect: /2782|кровообращения|мВОЗ|ЭхоКГ|беремен/i },
  { n: 111, q: "хроническая болезнь почек СКФ беременность", expect: /469|ХБП|хроническ.*почек|СКФ/i },
  { n: 112, q: "анемия при ХБП эритропоэтин гемоглобин", expect: /623|анемия|ХБП|эритропоэтин|ЭПО/i },
  { n: 113, q: "лактационный мастит абсцесс молочной железы", expect: /858|мастит|лактац|абсцесс/i },
  { n: 114, q: "недержание мочи стрессовое УЗИ малого таза", expect: /8|недержание|стрессов/i },
  { n: 115, q: "ревматоидный артрит беременность метотрексат", expect: /250|ревматоид|метотрексат|беремен/i },
  { n: 116, q: "острое повреждение почек новорожденный креатинин", expect: /1043|ОПП|повреждение почек|новорожден/i },
];

function embApi() {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    const base = (process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1")
      .replace(/\/chat\/completions$/, "")
      .replace(/\/$/, "");
    return {
      url: `${base}/embeddings`,
      key: openrouter,
      model: process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small",
      openrouter: true,
    };
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (!openai) return null;
  return {
    url: "https://api.openai.com/v1/embeddings",
    key: openai,
    model: "text-embedding-3-small",
    openrouter: false,
  };
}

async function embed(api, text) {
  const res = await fetch(api.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api.key}`,
      "Content-Type": "application/json",
      ...(api.openrouter
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://sonogyn.pro",
            "X-Title": "SonoGyn vault verify",
          }
        : {}),
    },
    body: JSON.stringify({ model: api.model, input: text.slice(0, 8000) }),
  });
  if (!res.ok) throw new Error(`embed HTTP ${res.status}`);
  const json = await res.json();
  const v = json?.data?.[0]?.embedding;
  if (!Array.isArray(v) || v.length !== 1536) throw new Error("bad embedding dims");
  return v;
}

function hitBlob(h) {
  return [h.title, h.source_title, h.organization, h.section_title, h.quote, h.external_url]
    .filter(Boolean)
    .join(" | ");
}

async function withRetry(label, fn, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      console.log(`retry ${label} ${i + 1}/${tries}: ${e?.message || e}`);
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw last;
}

async function main() {
  console.log("=== VAULT VERIFY (checklist) ===");
  console.log("EVIDENCE_MEDICAL_VAULT:", vaultOn ? "on" : "OFF");
  console.log("EVIDENCE_MEDICAL_VAULT_FTS:", ftsOn ? "on" : "OFF");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "найдено" : "отсутствует");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", key ? "найдено" : "отсутствует");
  console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY?.trim() ? "найдено" : "отсутствует");
  if (!url || !key) process.exit(1);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const sources = await withRetry("list sources", async () => {
    const { data, error } = await supabase
      .from("sources")
      .select("id,title,review_status,rag_allowed,external_url,organization")
      .eq("review_status", "published")
      .eq("rag_allowed", true);
    if (error) throw new Error(error.message);
    return data;
  });

  const whoInRag = (sources || []).filter(
    (s) => /WHO|ВОЗ|non.?communicable/i.test(`${s.title} ${s.organization || ""}`) && /NC|non.?communicable/i.test(`${s.title}`),
  );
  console.log("\n— Inventory");
  console.log("published+rag sources:", (sources || []).length);
  console.log("WHO/NC in RAG:", whoInRag.length === 0 ? "нет (ok)" : `FAIL ${whoInRag.length}`);

  const chunkTotal = await withRetry("count chunks", async () => {
    const { count, error } = await supabase
      .from("source_chunks")
      .select("id, sources!inner(rag_allowed,review_status)", { count: "exact", head: true })
      .eq("sources.rag_allowed", true)
      .eq("sources.review_status", "published")
      .in("review_status", ["published", "reviewed", "extracted"]);
    if (error) throw new Error(error.message);
    return count;
  });
  const chunkEmb = await withRetry("count emb", async () => {
    const { count, error } = await supabase
      .from("source_chunks")
      .select("id, sources!inner(rag_allowed,review_status)", { count: "exact", head: true })
      .eq("sources.rag_allowed", true)
      .eq("sources.review_status", "published")
      .in("review_status", ["published", "reviewed", "extracted"])
      .not("embedding", "is", null);
    if (error) throw new Error(error.message);
    return count;
  });
  const chunkNull = await withRetry("count null emb", async () => {
    const { count, error } = await supabase
      .from("source_chunks")
      .select("id, sources!inner(rag_allowed,review_status)", { count: "exact", head: true })
      .eq("sources.rag_allowed", true)
      .eq("sources.review_status", "published")
      .in("review_status", ["published", "reviewed", "extracted"])
      .is("embedding", null);
    if (error) throw new Error(error.message);
    return count;
  });
  console.log("chunks published:", chunkTotal, "| with embedding:", chunkEmb, "| null embedding:", chunkNull);

  const api = embApi();
  console.log("\n— Query smoke (FTS" + (api ? "+semantic" : "") + ")");
  let pass = 0;
  let fail = 0;
  let empty = 0;
  const fails = [];

  for (const item of QUERIES) {
    let ftsHits = [];
    let semHits = [];
    try {
      ftsHits = await withRetry(`fts #${item.n}`, async () => {
        const { data: fts, error: fErr } = await supabase.rpc("match_medical_vault_chunks_fts_ru", {
          query_text: item.q,
          match_count: 8,
        });
        if (fErr) throw new Error(fErr.message);
        return fts || [];
      }, 3);
    } catch (e) {
      fails.push({ n: item.n, reason: `FTS error: ${e.message || e}` });
      fail += 1;
      console.log(`#${item.n} FAIL fts-error`);
      continue;
    }

    if (api) {
      try {
        const vector = await embed(api, item.q);
        semHits = await withRetry(`sem #${item.n}`, async () => {
          const { data: sem, error: semErr } = await supabase.rpc("match_medical_vault_chunks", {
            query_embedding: vector,
            match_threshold: 0.2,
            match_count: 8,
          });
          if (semErr) throw new Error(semErr.message);
          return sem || [];
        }, 2);
      } catch {
        semHits = [];
      }
    }

    const combined = [...ftsHits, ...semHits];
    if (combined.length === 0) {
      empty += 1;
      fail += 1;
      fails.push({ n: item.n, reason: "empty" });
      console.log(`#${item.n} FAIL empty | ${item.q}`);
      continue;
    }

    const blob = combined.map(hitBlob).join("\n");
    const ok = item.expect.test(blob);
    const top = combined[0];
    const topTitle = (top.title || top.source_title || "").slice(0, 70);
    if (ok) {
      pass += 1;
      console.log(`#${item.n} PASS | top: ${topTitle}`);
    } else {
      fail += 1;
      fails.push({ n: item.n, reason: `expect miss; top=${topTitle}` });
      console.log(`#${item.n} FAIL expect | top: ${topTitle}`);
    }
  }

  console.log("\n— Summary");
  console.log(`pass=${pass} fail=${fail} empty=${empty} total=${QUERIES.length}`);
  if (fails.length) {
    console.log("failures:");
    for (const f of fails) console.log(`  #${f.n}: ${f.reason}`);
  }
  const exitOk = vaultOn && ftsOn && whoInRag.length === 0 && pass >= Math.floor(QUERIES.length * 0.7);
  console.log(exitOk ? "\nVERDICT: OK (≥70% queries + flags + no WHO in RAG)" : "\nVERDICT: NEEDS ATTENTION");
  process.exit(exitOk ? 0 : 2);
}

main().catch((e) => {
  console.error("FATAL", e?.message || e);
  process.exit(1);
});
