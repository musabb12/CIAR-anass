Fastlane guide

This project includes a Fastlane skeleton for iOS and Android deployment. The lanes are intentionally conservative and require credentials to be provided via environment variables or Fastlane match/service account setup.

Quick usage (macOS for iOS):

1. Install fastlane:

```bash
sudo gem install fastlane -NV
# or use bundler if you prefer
```

2. iOS release (on macOS):

```bash
export IOS_SCHEME=App
cd ios
fastlane ios release
```

3. Android release (on Linux/macOS):

- Ensure `google_play_service_account.json` is available and `SUPPLY_JSON_KEY` env points to it or use `supply` opts.

```bash
export SUPPLY_JSON_KEY=./fastlane/google_play_service_account.json
cd ..
fastlane android release
```

Notes:
- Replace placeholders in `fastlane/Appfile` with your Apple ID and bundle identifier.
- Fastlane `supply` and `deliver` require service account / API access configured.

Asset placeholders
------------------
This repository also includes placeholder store assets in `fastlane/metadata/`:
- Android listing images: `fastlane/metadata/android/en-US/images/`
- iOS screenshots: `fastlane/metadata/ios/en-US/screenshots/`

Replace these placeholder PNGs with final marketing images before uploading to the stores.

Additional store metadata templates:
- iOS App Store metadata template: fastlane/metadata/ios/en-US/app_store_connect_metadata.txt
- Android image mapping: fastlane/metadata/android/en-US/image_mapping.txt
