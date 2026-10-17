# Getting clean raw screenshots

Aim for the device's exact pixel size, real-looking data, a clean status area.

## iOS simulator

```bash
xcrun simctl boot "iPhone 17 Pro Max"            # 6.9"-class: 1320 x 2868
xcrun simctl status_bar booted override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
xcrun simctl io booted screenshot raw/iphone-6.9/01-home.png
```

iPad 13": boot an "iPad Pro 13-inch" simulator, screenshot the same way (2064 x 2752). The renderer places the screenshot
on the phone, status bar and all: hide notifications, set the time, full battery.

## Android emulator or phone

```bash
adb exec-out screencap -p > raw/play-phone/01-home.png
adb shell settings put global sysui_demo_allowed 1   # demo mode: clean status bar (then the demo-mode broadcasts)
```

Use an emulator with a 1080 x 2160 (or taller, up to 2:1) screen for Play, so the raw already has the right aspect.

## Flutter or any web build, headless Chrome

Serve a release web build with demo data on a local backend and drive it with the DevTools protocol: set the viewport to
the device's CSS size and `deviceScaleFactor` 3, open each route, tap through, screenshot. A viewport of 440 x 956 at
scale 3 gives 1320 x 2868, 360 x 720 at scale 3 gives 1080 x 2160. Wait for fonts and images before the shot.

## Rules

- Same data on every picture (same user, same restaurant or shop, same cart).
- Show the app's best state: a full menu, a real order, a photographed product. No empty lists, no spinners.
- Light mode unless the app is dark-first. The same theme on every picture.
- No personal data of real people on screen.
