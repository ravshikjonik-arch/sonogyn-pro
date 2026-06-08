export const trialConfig = {
  enabled: true,
  // If true, activation tries one-time code redemption in Firestore first.
  useFirebaseOneTimeCodes: true,
  firebaseCollection: "trial_codes",
  // Fallback static codes (works without Firestore write access).
  // Format: code -> trial duration in days.
  fallbackCodes: {
    COLLEAGUE7: 7,
    COLLEAGUE14: 14,
    MEDTEAM30: 30,
  } as Record<string, number>,
} as const;
