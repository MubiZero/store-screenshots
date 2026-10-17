# Design rules for a screenshot row

What the big food, ride and shopping apps do, reduced to rules a config can follow.

## Composition

1. **One background for the row.** The pictures are slices of one wide canvas: a flat brand colour (or a gentle
   two-colour gradient), a few darker soft shapes, one thin line crossing every picture at a different height. When you
   swipe, it feels like moving over one surface.
2. **Things on the seams.** A dish, a product, a coffee bean sits on the border: half in one picture, half in the next.
   Three to six of them, different sizes and tilts, never over the headline or the part of the screen that proves it.
3. **Headline top-left, two lines, big.** Left-aligned reads fastest; centre only for a very short row. Same size,
   same place on every picture.
4. **The phone bleeds off the bottom.** It fills 80 to 85 % of the width and runs off the lower edge: more screen,
   no dead strip. Keep a whole phone (`bleed: false`) only when the bottom of the screen is the point.
5. **A hero first.** No phone: brand, the biggest headline, the app's best food or product shots large and overlapping,
   one pill-shaped badge. It carries the first impression on Google Play, where the first picture shows large.

## Copy

- Two lines, at most five words a line, verb or benefit first: "Order in two taps", "Know when it is ready".
- One idea per picture, in the order of use. The headline names what the screen shows.
- Plain words of the store's language; no jargon, no slogans, no exclamation marks, no emoji in headlines.
- True today. No "best", "#1", discounts or prices that will go stale. Numbers only if the app shows them.
- Translate by writing, not by machine: a long headline in another language breaks the layout, so check each row.

## Colour

- Take the brand colour from the app's own theme; text white or the brand's darkest colour, 4.5:1 or better.
- Shapes are the background a step darker (or lighter on a dark background), not a second colour.
- The line and the hero badge use the accent. One accent only.
- Light app screens on a saturated background work best; a dark app on a dark background needs a lighter bezel.

## What makes a row look cheap

- Raw screenshots with status-bar clutter, notifications, a debug banner, an empty state or test data.
- Different headline sizes or phone positions from picture to picture.
- Decoration that hides the screen, or photos with a background pasted on a flat colour.
- A gradient with two unrelated colours, a drop shadow on everything, text in three styles.
- Rows in one language over screens in another.

## Photos and trademarks

Use cut-outs you may use (your own, licensed stock). A restaurant's own food photos are the best decoration;
stock photos need their licence's terms. Logos of other brands do not belong on your listing.
