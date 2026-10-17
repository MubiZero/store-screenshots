# Config reference

`node scripts/render.mjs config.json [--device <name>] [--only <slot>] [--no-preview]`. Paths are relative to the
config file. Everything but `devices` and `slots` has a default.

```jsonc
{
  "out": "out",                       // output folder: out/<device>/<slot>.png and out/preview-<device>.png
  "format": "png",                    // "png" | "jpeg" (jpeg flattens: sips on macOS or ImageMagick `magick`)

  "font": {                           // the headline font
    "file": "fonts/Brand-Bold.ttf",   // optional: a font file (check it has your language's letters)
    "family": "system-ui",            // used when there is no file; the fallback chain is added
    "weight": 700
  },

  "theme": {
    "background": "#2649C0",          // one colour, or ["#0B0E15", "#2649C0"] for a gradient across the row
    "shapes": ["#1F3FA6", "#17307F"], // colours of the soft shapes (default: the background darker)
    "text": "#FFFFFF",                // headline colour
    "accent": "#FFFFFF",              // the line, and the hero badge's fill
    "badgeText": "#2649C0",           // the hero badge's text (default: the first background colour)
    "phone": "#0A0D1C"                // bezel
  },

  "layout": {
    "align": "left",                  // headline: "left" | "center"
    "titleSize": 0.078,               // headline size as a share of the picture width
    "phoneWidth": 0.82,               // phone width as a share of the picture width
    "phoneTop": 0.24,                 // phone top as a share of the picture height
    "bleed": true                     // the phone runs off the bottom edge (false: a whole phone)
  },

  "decor": {
    "style": "auto",                  // "auto": soft shapes and one wave from the theme | "none"
    "shapes": [                       // replaces the auto shapes
      { "kind": "ellipse", "cx": 0.3, "cy": 0.9, "rx": 0.55, "ry": 0.2, "rot": -20, "color": "#1F3FA6", "opacity": 1 },
      { "kind": "ring", "cx": 1.0, "cy": 0.86, "r": 0.55, "stroke": 0.012, "color": "#8DAFFE", "opacity": 0.4 }
    ],
    "line": {                         // replaces the auto line; null for none
      "points": [[0, 0.3], [1.2, 0.2], [2.5, 0.3], [4, 0.22]],
      "color": "#FFFFFF", "opacity": 0.8, "width": 0.006
    },
    "border": [                       // cut-out pictures on a seam, half in each neighbour
      { "at": 1, "y": 0.2, "w": 0.34, "rot": -14, "file": "decor/cup.svg", "z": 1 }
    ]
  },

  "devices": {                        // one row per device
    "iphone-6.9": { "size": [1320, 2868], "raw": "raw/iphone-6.9" },
    "play-phone": { "size": [1080, 2160], "raw": "raw/play-phone" }
  },

  "slots": [                          // the pictures, in order; the same slots on every device
    {
      "name": "00-hero", "kind": "hero",
      "title": ["Your morning", "coffee, ahead of the queue"],
      "brand": "Brew", "logo": "logo.svg", "logoMono": true,  // logo is optional; logoMono paints it white
      "badge": "Order in two taps",
      "images": [ { "file": "decor/cup.svg", "x": 0.5, "y": 0.42, "w": 1.0, "rot": -6, "z": 3 } ]
    },
    { "name": "01-menu", "file": "01-menu.png", "title": ["Everything", "on one menu"] }
  ]
}
```

## Coordinates

- `x` in picture widths from the left edge of the **row** (picture k starts at x = k). A decoration `cx: 1.0` is
  the seam between the first and the second picture. `y` is a share of the picture height. `w`, `rx`, `r` are
  shares of one picture's width.
- Hero `images` use `x` and `w` within the hero picture (0 to 1); `y` is the top edge.
- `border[].at` is the seam index: `at: 2` centres the picture on the line between the second and third pictures.

## Notes

- Raw screenshots may have any size; the phone shows them at the phone's width, so give each device raw files in its
  own aspect (an iPhone shot on the Play row is stretched).
- A tablet device (width > 0.7 of its height) gets a smaller headline and a slightly wider phone automatically.
- Cut-out pictures (PNG/WebP with transparency, SVG) work best; photos with a background look pasted on.
- Re-running overwrites `out/`. The preview row is for you; do not upload it.
