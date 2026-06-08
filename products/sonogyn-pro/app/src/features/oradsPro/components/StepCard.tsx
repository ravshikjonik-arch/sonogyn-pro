import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  required?: boolean;
  children: ReactNode;
};

export default function StepCard({ title, required, children }: Props) {
  return (
    <View style={[styles.card, required && styles.required]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  required: {
    borderColor: "#f59e0b",
  },
  title: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "800",
  },
});
