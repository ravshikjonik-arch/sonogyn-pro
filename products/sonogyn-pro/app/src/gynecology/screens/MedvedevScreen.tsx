import { ScrollView, Text, View } from "react-native";
import type { PageType } from "../../navigationTypes";
import { GynBackToHub } from "../components/GynBackToHub";
import { MEDVEDEV_BOOK_META, medvedevConsensusChapters } from "../medvedevConsensusReference";
import { gynRouterStyles as s } from "../gynRouterStyles";

export function ScreenMedvedevConsensus({ setPage }: { setPage: (p: PageType) => void }) {
  return (
    <View style={s.card}>
      <GynBackToHub onPress={() => setPage("gyn_hub")} />
      <Text style={s.title}>{MEDVEDEV_BOOK_META.title}</Text>
      <Text style={s.meta}>
        {MEDVEDEV_BOOK_META.authors}, {MEDVEDEV_BOOK_META.publisher}, {MEDVEDEV_BOOK_META.year}. ISBN {MEDVEDEV_BOOK_META.isbn}
      </Text>
      <Text style={[s.result, { marginTop: 10 }]}>
        Ниже — сжатая структура по оглавлению и предисловию книги (образовательно). Полный текст и иллюстрации — в оригинальном издании и в первоисточниках консенсусов MUSA, IETA, IOTA, IDEA.
      </Text>
      <ScrollView style={{ maxHeight: 520 }} nestedScrollEnabled showsVerticalScrollIndicator>
        {medvedevConsensusChapters.map((ch) => (
          <View key={ch.id} style={{ marginTop: 14, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
            <Text style={[s.tileTitle, { color: "#0f766e" }]}>{ch.title}</Text>
            {ch.subtitle ? <Text style={[s.meta, { marginTop: 2 }]}>{ch.subtitle}</Text> : null}
            <Text style={[s.meta, { marginTop: 4 }]}>Стр. {ch.pages}</Text>
            {ch.bullets.map((b, bi) => (
              <Text key={`${ch.id}_${bi}`} style={[s.result, { marginTop: 6 }]}>
                • {b}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
