# App Store Review — notes for Connect

## Demo account (Guideline 2.1)

**Sign-in is not required.** Production builds ship with open access:

- `EXPO_PUBLIC_OPEN_ACCESS_FULL=true`
- `EXPO_PUBLIC_MOBILE_REQUIRE_REGISTRATION=false`

App Review Information fields:

| Field | Value |
| --- | --- |
| Sign-in required | **No** (leave username/password empty or `N/A`) |
| Notes | See template below |

### Notes template (paste into App Review Information → Notes)

```
SonoGyn Pro is open for App Review without registration.

How to access all features:
1. Launch the app.
2. Accept the consent screen if shown.
3. Tap «Начать» on the welcome poster.
4. You are in the clinical cabinet: calculators (O-RADS, IOTA, BI-RADS, obstetric), education, pharmacy, doctor chat (read).

Optional: Profile → sign in with email is available, but not needed for review.
Previous demo credentials were invalid; please ignore them. Full functionality works as a guest.
```

### Reply to Resolution Center (after new build)

```
Hello App Review team,

Thank you for the feedback on submission c7c375f3-c16d-432a-9e72-7cab6fbe7a35.

1) Guideline 2.1 — Demo account
The previous username/password did not work. Registration is intentionally disabled for the pilot: the app opens the full cabinet without sign-in. Please review as a guest: launch → consent (if shown) → «Начать» → home with calculators, education, and chat.

2) Guideline 2.3.10 — Android references
We removed Google Play / Android store references from user-visible copy in the iOS binary (legal consent, terms, privacy, access hints). This build is App Store–only wording.

Please continue the review with this new build.

Kind regards,
SonoGyn Pro
```

## Metadata 2.3.10 checklist

User-visible iOS strings must not mention Google Play, Android, or APK. Code comments and `Platform.OS === "android"` branches are fine.
