# Fling

A retro grappling game with Atari 2600-style graphics. Swing from the ceiling with your ninja rope and travel as far as you can without touching the ground.

```
    @@                          ##
   @@@@     /                 ######
  @@@@@@   /          ##    ########
 @@@@@@   /          ####  ##########
          /         ##################
         /
        []          ___  ___  ___
                   |   ||   ||   |
______________________________ground______
```

## Play

Open `index.html` in any browser. No server, no build tools, no dependencies.

## Controls

**One button.** Hold Space / Click / Tap to fire your rope. Release to let go.

Time your release to carry momentum forward. That's it.

## The Game

You start on a pedestal. Fire your first rope when you're ready.

Each swing costs one rope from your inventory (you start with 15). Grab the gold boxes floating in your path to replenish your supply (+5 each). Run out of ropes and you're at gravity's mercy.

Touch the ground and it's over. Your distance is your score.

## Biomes

Keep swinging and the world changes around you. 12 color palettes cycle as you progress:

Jungle / Autumn / Desert / Night / Ice / Volcanic / Cotton Candy / Synthwave / Ocean / Sunset / Lavender / Bubblegum

## Tech

- Vanilla HTML/CSS/JavaScript
- HTML5 Canvas at 320x180, scaled up with `image-rendering: pixelated`
- Constraint-based pendulum physics
- Atari 2600-style rope rendering (2px ball on scanlines)
- 6-layer parallax scrolling with seeded random generation
- Bitmap 3x5 pixel font for score display

## License

[MIT](LICENSE)
