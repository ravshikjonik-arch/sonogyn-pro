import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LegalScrollLayout from "../components/legal/LegalScrollLayout";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "TermsOfUse">;

/** Terms of Use — full legal text (RU/EN/ES via i18n). */
export default function TermsScreen({ navigation }: Props) {
  return (
    <LegalScrollLayout
      titleKey="legal_terms_title"
      bodyKey="legal_terms_body"
      navigation={navigation}
      showPublicUrls
    />
  );
}
