# CutLog

Personal cut tracker. Food, workouts, activity, and body weight go in. Estimated energy balance and fat-loss pace come out. Voice-first, fully usable by hand, local-only.

This is a React Native CLI app (not Expo).

## Important: API keys

API keys shipped inside a mobile app can be extracted from the package. Direct Groq/NVIDIA calls from the client are acceptable for this personal prototype. A production or public version should proxy those requests through a backend or secure gateway.

Never commit a real `.env`.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in keys as needed:

```
GROQ_API_KEY=
GROQ_TEXT_MODEL=llama-3.1-8b-instant
GROQ_TRANSCRIPTION_MODEL=whisper-large-v3-turbo

NVIDIA_API_KEY=
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_TEXT_MODEL=meta/llama-3.1-8b-instruct

AI_PRIMARY_PROVIDER=groq
AI_FALLBACK_PROVIDER=nvidia
```

Manual logging works with no keys. Voice transcription and semantic parsing need Groq (primary). NVIDIA is the text-parsing fallback.

Personal Android download (after DNS is live):

https://cutlog.kartikey.xyz

APK:

https://cutlog.kartikey.xyz/downloads/cutlog-1.1.apk

After 1.1 is installed, the app checks `https://cutlog.kartikey.xyz/downloads/latest.json` on launch and offers to install newer APKs.

Recording uses `react-native-nitro-sound` (React Native CLI / New Architecture compatible).

## Run

```bash
npm start
npm run android
```

iOS (macOS with Xcode and CocoaPods):

```bash
cd ios && bundle exec pod install && cd ..
npm run ios
```

## Tests

```bash
npm test
npx tsc --noEmit
npm run lint
```

## Energy model

CutLog does **not** compute deficit as food minus workout calories.

1. BMR via Mifflin-St Jeor
2. Base daily expenditure = BMR × everyday-movement multiplier (NEAT, not gym)
3. Estimated burn = base daily expenditure + logged workout/activity calories
4. Balance = calories eaten − estimated burn

Activity level describes non-exercise movement so logged exercise is not double-counted.

7700 kcal ≈ 1 kg fat is used only for estimates.

## Voice pipeline

Microphone → local recording → Groq Whisper transcription → intent/entity parse (local first, LLM if needed) → confirmation → AsyncStorage.

Groq is primary for structured extraction. If Groq fails (timeout, 5xx, rate limit, unsupported model, malformed JSON after one retry), NVIDIA is tried automatically. Invalid user input does not fail over.
