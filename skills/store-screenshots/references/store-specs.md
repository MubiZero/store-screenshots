# Store specs

Checked 2026-10 against the stores' help pages as remembered when this skill was written. Stores change these; open
the current page before a release (App Store Connect: "Screenshot specifications"; Play Console: "Add preview assets").

## Apple App Store (iOS)

| Device class | Accepted sizes (portrait, px) | Use in `devices` |
|---|---|---|
| iPhone 6.9" (required) | 1320 x 2868 (also 1290 x 2796, 1260 x 2736) | `[1320, 2868]` |
| iPhone 6.5" (needed only if no 6.9") | 1284 x 2778, 1242 x 2688 | |
| iPad 13" (required for iPad apps) | 2064 x 2752 (also 2048 x 2732) | `[2064, 2752]` |

- 1 to 10 screenshots per device class; PNG or JPEG, RGB, no transparency; the first three show before scrolling.
- The images must show the app in use; text and frames around it are allowed.

## Google Play

| Asset | Size | Notes |
|---|---|---|
| Phone screenshots | each side 320 to 3840 px, long side at most 2x the short side | 2 to 8; `[1080, 2160]` is the tallest 2:1 at 1080 wide |
| 7" and 10" tablet screenshots | same limits | optional, improves tablet ranking |
| Feature graphic | 1024 x 500 | required; PNG or JPEG, no transparency |
| App icon | 512 x 512 | PNG, 32-bit, at most 1024 KB |

- JPEG or 24-bit PNG without alpha for screenshots.
- A promo video is optional; the feature graphic shows over it.

## Content rules that bite

- No misleading images: only what the app does, no device frames of products you do not make.
- Text on images in the store's language; localise the row per language when the listing has several.
- Do not show prices, ratings, awards or rankings that are not current and true.
