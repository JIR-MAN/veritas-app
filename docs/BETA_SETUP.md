# Getting an installable beta

## Android (free)
1. Create a free account at https://expo.dev/signup.
2. In Expo, go to **Account settings → Access tokens → Create token**.
3. In GitHub, go to **veritas-app → Settings → Secrets and variables → Actions → New repository secret**. Name it `EXPO_TOKEN` and paste the token. Never paste it in chat.
4. Tell Claude it's done. Claude starts the **Beta build** workflow, which runs every check and then builds an APK. You get a download link and QR code from expo.dev.

## iPhone and iPad
- An Apple Developer Program membership is required (US$99/year): https://developer.apple.com/programs/
- After that, EAS can produce a TestFlight build. Apple may review external TestFlight builds.

Nothing will be submitted to the App Store or Google Play without your explicit approval.
