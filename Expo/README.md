# Expo

Vathavaran's mobile client. Defaults to the new Next API at
https://vathavaran-variable.vercel.app with no Worker fallback.

```sh
npm ci
npm start
npm run typecheck
npm run lint
npx expo install --check
npx expo-doctor
eas build --profile preview --platform android
```

The internal preview profile creates an Android APK. Its GitHub browser login returns
to `vathavaran://auth/callback`; the Next server owns the GitHub callback itself.
Use a preview/development build for this native deep link.

The account screen offers dark/light/system themes. Native tokens are stored in
SecureStore; legacy plaintext fallback sessions are migrated into secure storage.
Decrypted file contents are only held in the current file sheet and hidden when the
app goes into the background. Clipboard contents remain until replaced.

Server environment credentials do not belong in Expo. Only EXPO_PUBLIC_BACKEND_URL
and EXPO_PUBLIC_AUTH_CALLBACK_URL are public configuration. Changes require a new
bundle/build. Run dependency checks before changing Expo SDK versions.
