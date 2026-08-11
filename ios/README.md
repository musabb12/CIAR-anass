iOS Capacitor target — preparation notes

This repository is prepared for Capacitor iOS, but the iOS native project cannot be created on Linux. Follow these steps on a macOS machine with Xcode installed to add and build the iOS target.

Required environment on macOS:
- Xcode (latest stable)
- CocoaPods
- Node 18+
- CocoaPods: `sudo gem install cocoapods` or `brew install cocoapods`

Steps to create and build the iOS app (run on macOS):

1. Install dependencies and build the web app:

```bash
npm install
npm run build
```

2. Copy/sync the web assets to native projects and add iOS platform:

```bash
npx cap sync
npx cap add ios
npx cap open ios
```

3. In Xcode:
- Select a development Team
- Create or import provisioning profiles for Release
- Set the iOS deployment target to 13.0+ (match `capacitor.config.ts`)
- Build a Release archive and export for App Store

Notes:
- This repo contains `capacitor.config.ts` with iOS placeholders and `ios/` README to guide the macOS steps.
- I cannot create an Xcode project on this Linux runner. All native iOS steps must be executed on macOS.

If you want, I can prepare additional helper scripts (Fastlane, export options) once you confirm you will run the macOS steps.
