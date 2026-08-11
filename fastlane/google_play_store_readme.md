Google Play upload notes

Provide a Google Play service account JSON and point the environment variable `SUPPLY_JSON_KEY` to it, or place it at `fastlane/google-play-service-account.json`.

Example environment:

```bash
export SUPPLY_JSON_KEY=./fastlane/google-play-service-account.json
export PLAY_STORE_TRACK=internal
```

Then run:

```bash
fastlane android release
```
