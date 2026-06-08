import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { PageType } from "../../navigationTypes";
import { GynBackToHub } from "../components/GynBackToHub";
import { formatRuDate, parseRuDate } from "../dateUtils";
import {
  approximateGaDaysFromSingleBiometry,
  eddFromEmbryoTransfer,
  eddFromLmp,
  eddFromOvulation,
  eddFromUltrasound,
  gaDaysFromCrlMm,
  gaFromLmp,
  maternityLeaveHintsRu,
  screeningHintsRu,
  eddFromCrlAndUsDate,
  eddFromBiometryAndUsDate,
  lmpFromEdd,
} from "../pregnancyCalc";
import { gynRouterStyles as s } from "../gynRouterStyles";

export function ScreenGaLmp({ setPage }: { setPage: (p: PageType) => void }) {
  const [lmpStr, setLmpStr] = useState("");
  const [out, setOut] = useState<string>("");
  const run = () => {
    const lmp = parseRuDate(lmpStr);
    if (!lmp) {
      setOut("Введите дату ПМП в формате дд.мм.гггг");
      return;
    }
    const today = new Date();
    const ga = gaFromLmp(lmp, today);
    const edd = eddFromLmp(lmp);
    const hints = screeningHintsRu(ga.totalDays);
    setOut(
      `Срок сегодня: ${ga.weeks} нед. ${ga.days} дн. (всего ${ga.totalDays} дн. от ПМП)\n` +
        `ПДР (Негеле +280 дн.): ${formatRuDate(edd)}\n\n` +
        hints.join("\n")
    );
  };
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Срок беременности по менструации</Text>
      <Text style={s.label}>Первый день последней менструации (дд.мм.гггг)</Text>
      <TextInput value={lmpStr} onChangeText={setLmpStr} placeholder="01.01.2025" style={s.input} />
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Рассчитать</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}

export function ScreenGaUs({ setPage }: { setPage: (p: PageType) => void }) {
  const [usStr, setUsStr] = useState("");
  const [gw, setGw] = useState("12");
  const [gd, setGd] = useState("0");
  const [out, setOut] = useState("");
  const run = () => {
    const us = parseRuDate(usStr);
    if (!us) {
      setOut("Дата УЗИ: дд.мм.гггг");
      return;
    }
    const w = Math.max(0, parseInt(gw, 10) || 0);
    const d = Math.min(6, Math.max(0, parseInt(gd, 10) || 0));
    const edd = eddFromUltrasound(us, w, d);
    const lmpEst = lmpFromEdd(edd);
    const gaToday = gaFromLmp(lmpEst, new Date());
    const hints = screeningHintsRu(gaToday.totalDays);
    setOut(
      `ПДР по УЗИ: ${formatRuDate(edd)}\n` +
        `Оценка ПМП: ${formatRuDate(lmpEst)}\n` +
        `Срок сегодня (от оценки ПМП): ${gaToday.weeks} нед. ${gaToday.days} дн.\n\n` +
        hints.join("\n")
    );
  };
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Срок беременности по УЗИ</Text>
      <Text style={s.label}>Дата исследования</Text>
      <TextInput value={usStr} onChangeText={setUsStr} placeholder="15.04.2025" style={s.input} />
      <Text style={s.label}>Срок на момент УЗИ (недели + дни, например 12+0)</Text>
      <View style={s.rowWrap}>
        <TextInput value={gw} onChangeText={setGw} keyboardType="number-pad" placeholder="12" style={[s.input, { width: 72 }]} />
        <Text style={s.label}>нед.</Text>
        <TextInput value={gd} onChangeText={setGd} keyboardType="number-pad" placeholder="0" style={[s.input, { width: 56 }]} />
        <Text style={s.label}>дн.</Text>
      </View>
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Рассчитать</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}

export function ScreenOvoIvf({ setPage }: { setPage: (p: PageType) => void }) {
  const [mode, setMode] = useState<"ov" | "ivf">("ov");
  const [dateStr, setDateStr] = useState("");
  const [embryo, setEmbryo] = useState<"3" | "5">("5");
  const [out, setOut] = useState("");
  const run = () => {
    const d = parseRuDate(dateStr);
    if (!d) {
      setOut("Дата: дд.мм.гггг");
      return;
    }
    if (mode === "ov") {
      const edd = eddFromOvulation(d);
      const lmpSyn = lmpFromEdd(edd);
      setOut(
        `ПДР (от овуляции +266 дн.): ${formatRuDate(edd)}\n` +
          `Ориентир «ПМП»: ${formatRuDate(lmpSyn)} (−280 дн. от ПДР)\n` +
          "При нерегулярном цикле и ЭКО используйте дату переноса."
      );
      return;
    }
    const edd = eddFromEmbryoTransfer(d, embryo === "5" ? 5 : 3);
    setOut(
      `ПДР после переноса (${embryo}-й день): ${formatRuDate(edd)}\n` +
        `Использованы ориентиры +${embryo === "5" ? "261" : "263"} к.д. (уточняйте в клинике ЭКО).`
    );
  };
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Овуляция и ЭКО</Text>
      <View style={s.rowWrap}>
        <Pressable style={[s.backBtn, mode === "ov" && { backgroundColor: "#ccfbf1" }]} onPress={() => setMode("ov")}>
          <Text style={s.backBtnText}>По овуляции</Text>
        </Pressable>
        <Pressable style={[s.backBtn, mode === "ivf" && { backgroundColor: "#ccfbf1" }]} onPress={() => setMode("ivf")}>
          <Text style={s.backBtnText}>Перенос ЭКО</Text>
        </Pressable>
      </View>
      {mode === "ivf" ? (
        <>
          <Text style={s.label}>День эмбриона</Text>
          <View style={s.rowWrap}>
            <Pressable style={[s.backBtn, embryo === "3" && { backgroundColor: "#ccfbf1" }]} onPress={() => setEmbryo("3")}>
              <Text style={s.backBtnText}>3 суток</Text>
            </Pressable>
            <Pressable style={[s.backBtn, embryo === "5" && { backgroundColor: "#ccfbf1" }]} onPress={() => setEmbryo("5")}>
              <Text style={s.backBtnText}>5 суток</Text>
            </Pressable>
          </View>
        </>
      ) : null}
      <Text style={s.label}>{mode === "ov" ? "Дата овуляции" : "Дата переноса"}</Text>
      <TextInput value={dateStr} onChangeText={setDateStr} placeholder="10.04.2025" style={s.input} />
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Рассчитать ПДР</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}

export function ScreenDekret({ setPage }: { setPage: (p: PageType) => void }) {
  const [eddStr, setEddStr] = useState("");
  const [out, setOut] = useState("");
  const run = () => {
    const edd = parseRuDate(eddStr);
    if (!edd) {
      setOut("ПДР: дд.мм.гггг");
      return;
    }
    const { prenatalStart, note } = maternityLeaveHintsRu(edd);
    setOut(
      `Предполагаемая дата родов: ${formatRuDate(edd)}\n` +
        `Ориентир начала отпуска по БиР (~70 к.д. до ПДР, одноплодие): ${formatRuDate(prenatalStart)}\n\n` +
        note
    );
  };
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Сроки декретного отпуска (ориентиры)</Text>
      <Text style={s.label}>ПДР (дд.мм.гггг)</Text>
      <TextInput value={eddStr} onChangeText={setEddStr} placeholder="01.12.2025" style={s.input} />
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Показать ориентиры</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}

export function ScreenCrl({ setPage }: { setPage: (p: PageType) => void }) {
  const [usStr, setUsStr] = useState("");
  const [crl, setCrl] = useState("");
  const [out, setOut] = useState("");
  const run = () => {
    const us = parseRuDate(usStr);
    const mm = parseFloat(crl.replace(",", "."));
    if (!us || !Number.isFinite(mm)) {
      setOut("Дата УЗИ и КТР в мм");
      return;
    }
    const gaDays = gaDaysFromCrlMm(mm);
    if (gaDays == null) {
      setOut("КТР обычно 2–84 мм для I триместра.");
      return;
    }
    const edd = eddFromCrlAndUsDate(us, mm);
    if (!edd) {
      setOut("Не удалось оценить ПДР.");
      return;
    }
    const w = Math.floor(gaDays / 7);
    const d = gaDays % 7;
    const hints = screeningHintsRu(gaDays);
    setOut(
      `Срок по КТР на дату УЗИ: ${w} нед. ${d} дн. (${gaDays} дн.)\n` +
        `ПДР: ${formatRuDate(edd)}\n` +
        `ПМП (оценка): ${formatRuDate(lmpFromEdd(edd))}\n\n` +
        hints.join("\n")
    );
  };
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Срок беременности по КТР</Text>
      <Text style={s.label}>Дата УЗИ</Text>
      <TextInput value={usStr} onChangeText={setUsStr} placeholder="20.03.2025" style={s.input} />
      <Text style={s.label}>КТР, мм</Text>
      <TextInput value={crl} onChangeText={setCrl} keyboardType="decimal-pad" placeholder="45" style={s.input} />
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Рассчитать</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}

export function ScreenFeto({ setPage }: { setPage: (p: PageType) => void }) {
  const [usStr, setUsStr] = useState("");
  const [kind, setKind] = useState<"BPD" | "HC" | "FL" | "AC">("BPD");
  const [mm, setMm] = useState("");
  const [out, setOut] = useState("");
  const run = () => {
    const us = parseRuDate(usStr);
    const v = parseFloat(mm.replace(",", "."));
    if (!us || !Number.isFinite(v)) {
      setOut("Дата УЗИ и размер в мм");
      return;
    }
    const gaDays = approximateGaDaysFromSingleBiometry(kind, v);
    if (gaDays == null) {
      setOut("Проверьте диапазон размеров для выбранного параметра.");
      return;
    }
    const edd = eddFromBiometryAndUsDate(us, kind, v);
    if (!edd) {
      setOut("Не удалось оценить ПДР.");
      return;
    }
    const w = Math.floor(gaDays / 7);
    const d = gaDays % 7;
    const hints = screeningHintsRu(gaDays);
    setOut(
      `Оценка срока по ${kind} (${v} мм): ~${w} нед. ${d} дн.\n` +
        `ПДР (ориентир): ${formatRuDate(edd)}\n` +
        "В I триместре предпочтительна КТР; фетометрия — грубый ориентир II–III триместра.\n\n" +
        hints.join("\n")
    );
  };
  const kinds: ("BPD" | "HC" | "FL" | "AC")[] = ["BPD", "HC", "FL", "AC"];
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>Срок по фетометрии (скрининг II–III тр., ориентир)</Text>
      <Text style={s.label}>Дата УЗИ</Text>
      <TextInput value={usStr} onChangeText={setUsStr} placeholder="05.06.2025" style={s.input} />
      <Text style={s.label}>Параметр</Text>
      <View style={s.rowWrap}>
        {kinds.map((k) => (
          <Pressable key={k} style={[s.backBtn, kind === k && { backgroundColor: "#fce7f3" }]} onPress={() => setKind(k)}>
            <Text style={s.backBtnText}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>Размер, мм</Text>
      <TextInput value={mm} onChangeText={setMm} keyboardType="decimal-pad" placeholder="52" style={s.input} />
      <Pressable style={s.btn} onPress={run}>
        <Text style={s.btnText}>Рассчитать ориентир</Text>
      </Pressable>
      {out ? <Text style={s.result}>{out}</Text> : null}
    </View>
  );
}
