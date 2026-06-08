import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LegalScrollLayout from "../components/legal/LegalScrollLayout";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "MedicalDisclaimer">;

export default function DisclaimerScreen({ navigation }: Props) {
  return (
    <LegalScrollLayout
      titleKey="legal_disclaimer_title"
      bodyKey="legal_disclaimer_body"
      navigation={navigation}
      showPublicUrls={false}
    />
  );
}
