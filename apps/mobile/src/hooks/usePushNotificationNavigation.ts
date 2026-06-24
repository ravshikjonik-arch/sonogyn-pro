import type { NavigationContainerRef } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";

import type { RootStackParamList } from "../navigation/paramLists";
import {
  navigateToDiscussionCase,
  parseDiscussionDeepLink,
  parseDiscussionPushData,
  type DiscussionPushPayload,
} from "../lib/push/discussionPushNavigation";

type Options = {
  enabled: boolean;
  navigationRef: NavigationContainerRef<RootStackParamList> | null;
};

function responseIdentifier(response: Notifications.NotificationResponse): string {
  return response.notification.request.identifier;
}

function payloadFromResponse(response: Notifications.NotificationResponse): DiscussionPushPayload | null {
  return parseDiscussionPushData(response.notification.request.content.data);
}

/**
 * Opens teaching-case discussion on web when user taps doctor-discussion push
 * or follows com.yakrav7700.usriskcalc://discussions/case/<id>.
 */
export function usePushNotificationNavigation({ enabled, navigationRef }: Options): void {
  const handledIds = useRef(new Set<string>());
  const pendingPayload = useRef<DiscussionPushPayload | null>(null);

  const openPayload = useCallback(
    async (payload: DiscussionPushPayload) => {
      if (!enabled) {
        pendingPayload.current = payload;
        return;
      }
      await navigateToDiscussionCase(navigationRef, payload);
    },
    [enabled, navigationRef],
  );

  const handleResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const id = responseIdentifier(response);
      if (handledIds.current.has(id)) return;
      handledIds.current.add(id);

      const payload = payloadFromResponse(response);
      if (!payload) return;
      void openPayload(payload);
    },
    [openPayload],
  );

  useEffect(() => {
    if (!enabled || !pendingPayload.current) return;
    const payload = pendingPayload.current;
    pendingPayload.current = null;
    void openPayload(payload);
  }, [enabled, openPayload]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let mounted = true;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) return;
      handleResponse(response);
    });

    const pushSub = Notifications.addNotificationResponseReceivedListener(handleResponse);

    async function handleUrl(url: string | null) {
      const payload = parseDiscussionDeepLink(url);
      if (!payload) return;
      await openPayload(payload);
    }

    void Linking.getInitialURL().then((initial) => void handleUrl(initial));
    const linkSub = Linking.addEventListener("url", (event) => void handleUrl(event.url));

    return () => {
      mounted = false;
      pushSub.remove();
      linkSub.remove();
    };
  }, [handleResponse, openPayload]);
}
