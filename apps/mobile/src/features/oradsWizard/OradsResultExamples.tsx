import {
  getOradsNosologyPreviewImage,
  getOradsResultExamples,
  resolveOradsNosologyImageUri,
  type OradsTreePathStep,
  type OradsTreeResult,
} from "@repo/orads-us";
import { StyleSheet, Text, View } from "react-native";

import { getWebAssetBase } from "../../api/chatBackend";
import OradsNosologyPreview from "../oradsPro/components/OradsNosologyPreview";

type Props = {
  path: readonly OradsTreePathStep[];
  result: OradsTreeResult;
};

/** After the wizard: practice echograms of what the computed result typically looks like. */
export default function OradsResultExamples({ path, result }: Props) {
  const examples = getOradsResultExamples(path, result);
  if (!examples.length) return null;

  const base = getWebAssetBase();

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Пример похожего случая</Text>
      <Text style={styles.sub}>
        Категория посчитана по вашим ответам. Ниже обезличенные эхограммы из практики для сравнения с вашей картиной.
        Не диагноз — интерпретация специалиста.
      </Text>
      {examples.map((entry) => {
        const preview = getOradsNosologyPreviewImage(entry);
        const imageUri = base && preview ? resolveOradsNosologyImageUri(preview, base) : null;
        return <OradsNosologyPreview key={entry.id} entry={entry} imageUri={imageUri} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 4 },
  title: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  sub: { fontSize: 12, lineHeight: 17, color: "#475569" },
});
