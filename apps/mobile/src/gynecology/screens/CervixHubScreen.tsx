import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable, Text, View } from "react-native";

import type { RootStackParamList } from "../../navigation/paramLists";
import type { PageType } from "../../navigationTypes";
import { openClinicalToolAction } from "../../lib/clinical-tools/openClinicalTool";
import { gynRouterStyles as s } from "../gynRouterStyles";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CervixHubScreen({ setPage }: { setPage: (p: PageType) => void }) {
  const navigation = useNavigation<Nav>();

  const items = [
    {
      id: "cytology",
      title: "Цитология и скрининг РШМ",
      sub: "Bethesda · HPV · ThinPrep · кейсы · AI · quiz",
      onPress: () => navigation.navigate("CervixCytologyModule"),
    },
    {
      id: "colposcopy",
      title: "Кольпоскопия (Swede)",
      sub: "Калькулятор на web",
      onPress: () => openClinicalToolAction(navigation, "colposcopy"),
    },
    {
      id: "cin",
      title: "CIN Risk",
      sub: "Оценка риска CIN2+",
      onPress: () => openClinicalToolAction(navigation, "cin_risk"),
    },
    {
      id: "cpi",
      title: "Cervical Intelligence",
      sub: "Маршрутизация шейки",
      onPress: () => openClinicalToolAction(navigation, "cervical_intelligence"),
    },
    {
      id: "length",
      title: "Длина шейки (УЗИ)",
      sub: "Native калькулятор",
      onPress: () => navigation.navigate("CervicalLengthCalc"),
    },
  ];

  return (
    <View style={s.card}>
      <Pressable style={s.backBtn} onPress={() => setPage("gyn_hub")}>
        <Text style={s.backBtnText}>← Гинекология</Text>
      </Pressable>
      <Text style={s.title}>Шейка матки</Text>
      <Text style={s.meta}>Скрининг · цитология · кольпоскопия · УЗИ</Text>
      <View style={s.rowWrap}>
        {items.map((it) => (
          <Pressable key={it.id} style={s.tile} onPress={it.onPress}>
            <Text style={s.tileTitle}>{it.title}</Text>
            <Text style={s.tileSub}>{it.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
