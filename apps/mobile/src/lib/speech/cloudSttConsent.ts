import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sonogyn-cloud-stt-consent:v1";

export async function hasMobileCloudSttConsent(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "1";
  } catch {
    return false;
  }
}

export async function grantMobileCloudSttConsent(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {
    /* noop */
  }
}
