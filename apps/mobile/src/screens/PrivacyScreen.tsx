import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LegalScrollLayout from "../components/legal/LegalScrollLayout";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "PrivacyPolicy">;

export default function PrivacyScreen({ navigation }: Props) {
  return (
    <LegalScrollLayout
      titleKey="legal_privacy_title"
      bodyKey="legal_privacy_body"
      navigation={navigation}
      showPublicUrls
    />
  );
}
