---
name: store-screenshots
description: >-
  Turn raw app screenshots into App Store and Google Play listing images: a short headline, a device
  frame and one background that runs through the whole row, so shapes, a line and dishes or products
  cross the borders between pictures, like the big food, ride and shopping apps do. Use whenever someone
  asks for store screenshots, app store images, Google Play screenshots, listing graphics, a screenshot
  carousel, "make my screenshots look good", ASO visuals or marketing screenshots for a mobile app, or
  needs the right pixel sizes for iPhone 6.9", iPad 13" or Play phone/tablet. Config-driven, no
  dependencies beyond Node and Chrome. Also checks sizes and writes copy for the headlines.
---

# Store Screenshots

A listing's screenshots are read in a second, mostly without sound or the description. They have one job:
say what the app does for the person and make the row look like one thing. This skill builds that row from the
app's own screenshots with `scripts/render.mjs`; the pictures are slices of one wide background, so what sits on a
border is half in one picture and half in the next.

## When it fits

- The user has (or can produce) raw screenshots of a mobile app and wants store-ready images.
- They name a store, a size, "carousel", "listing", "ASO", or just "make the screenshots look good".
- Not for: app icons, the feature graphic alone (see `references/store-specs.md`), video previews, desktop apps.

## The flow

1. **Get the raw screenshots.** Real screens with real-looking data, one folder per device
   (`raw/iphone-6.9/01-home.png`, ...). If there are none, capture them (`references/capture.md`: simulator,
   `adb`, headless Chrome for Flutter web). Never mock data that would look false in the store: no fake reviews,
   no screens the app does not have.
2. **Pick the story, 5 to 8 pictures.** One idea per picture, in the order a person would use the app: find, choose,
   order, follow, get. The first picture may be a **hero** without a phone (brand, big headline, food or product shots,
   a badge). Headlines: two lines, at most five words a line, a verb or a benefit, in the store's language
   (`references/design-rules.md` has the copy rules and examples).
3. **Take the brand from the app, not from taste.** Background = the brand colour (flat, or a two-colour
   gradient), text white or the brand's dark, shapes = the background a step darker or lighter. One accent. Check
   contrast (text on background at least 4.5:1).
4. **Write the config** (`examples/demo/config.json` is a working one; every option in `references/config.md`):
   devices with their pixel sizes, slots with titles and files, theme, decoration. Start from the demo and change
   the theme, the titles and the files.
5. **Render**: `node <skill>/scripts/render.mjs config.json`. It writes `out/<device>/<slot>.png`, checks that
   each file is exactly the device's size, and writes `out/preview-<device>.png`, the whole row in one picture.
6. **Look at the row, then at one full-size picture.** Fix what a person would see first (below), render again. Only
   `--only <slot>` / `--device <name>` re-render a part.
7. **Hand over the files with the sizes checked**, and say which store each folder is for. Uploading is the user's
   step; do not claim a store accepted anything.

## What to look at in the preview

- The headline reads in one second at thumbnail size (the store shows the row about 300 px wide).
- The phone shows the screen that proves the headline; nothing on the screen contradicts it (wrong language, test
  data, a debug banner, an empty state).
- The things on the borders continue: no object cut in a way that looks like a mistake, none hiding the headline or
  the phone's content.
- The first picture works alone: Google Play shows it large, the App Store shows the first three without scrolling.
- Same colours, same headline size, same phone position on every picture.

## Rules that are not negotiable

- Pixel sizes are exact (`references/store-specs.md`); the script refuses a picture of another size.
- The images show the real app. Decoration (dishes, shapes) is around the phone, never instead of it.
- A store may refuse transparency: set `"format": "jpeg"` (needs `sips` on macOS or ImageMagick) when the store asks
  for flattened images.
- Headlines promise only what the app does today. No "#1", no awards, no prices unless they are true and current.
- Respect trademarks and licences of the pictures put on the images (stock photos, food photos, logos).

## Files

- `scripts/render.mjs` — the renderer (Node 20+, Chrome or Chromium; `CHROME=<binary>` to choose).
- `references/config.md` — every config option with an example.
- `references/store-specs.md` — sizes and limits for the App Store and Google Play, with the date they were checked.
- `references/design-rules.md` — copy, colour, composition, what makes a row look cheap.
- `references/capture.md` — getting clean raw screenshots from a simulator, a phone, or a web build.
- `examples/demo/` — a made-up coffee app: raw screens, decoration, a working config, `make-raw.mjs`.
