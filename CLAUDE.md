# Fling - Retro Grappling Game

## Project Overview
A minimalist browser-based game with Atari 2600-style graphics. The player controls a red square using a ninja rope mechanic (inspired by the Worms series) to swing and travel endlessly from left to right, staying off the ground as long as possible.

## Tech Stack
- Vanilla HTML/CSS/JavaScript (no frameworks)
- HTML5 Canvas for rendering
- No build tools or dependencies

## File Structure
```
fling/
├── index.html    # Page with canvas element
├── style.css     # Retro scaling, centered layout
└── game.js       # All game logic (physics, rendering, input)
```

## How to Run
Open `index.html` directly in a browser. No server needed.

## Controls
- **Space / Click / Tap**: Hold to fire rope to ceiling, release to let go
- Timing the release builds momentum to travel rightward
- Player starts on a pedestal — fire when ready

## Game Mechanics

### Start
- Player begins standing on a raised pedestal, completely still
- Physics don't activate until the first rope is fired
- Pedestal scrolls off screen as the player moves right

### Physics
- Constant gravity pulls the player down
- Rope creates a pendulum constraint (fixed length from anchor point)
- Releasing the rope preserves current velocity (tangential momentum)
- Each rope attach gives a small forward speed boost (capped at MAX_SPEED)
- Ground collision stops vertical movement and applies friction
- Ceiling collision prevents going above the ceiling

### Rope Behavior
- Fires at a diagonal (up and to the right) at `ROPE_ANGLE` degrees
- Anchor point lands ahead of the player on the ceiling, enabling forward swing
- Rope length is shortened to 60% of actual distance — keeps swings tight and prevents dropping too low
- Only attaches if player is within max rope range (140px)
- While attached, player swings as a pendulum
- Releasing at the right angle/timing carries momentum forward

### Camera
- Smooth lerp follow (0.08 factor) — prevents jarring jumps on rope attach
- Targets player at 30% from left edge
- Vertical position is fixed (world doesn't scroll vertically)

## Rendering
- Canvas resolution: 320x180 (retro low-res)
- CSS scales to 960x540 with `image-rendering: pixelated` for blocky pixels
- No anti-aliasing, sharp edges

### Parallax Background (Jungle Hunt inspired)
- 3 canopy layers hanging from the ceiling (speeds: 0.2x, 0.5x, 0.8x)
- 3 brush layers growing from the ground (same speeds)
- Procedurally generated using seeded random for consistency
- Creates depth illusion as player moves through the jungle

## Color Palette
- Background: `#1a3a2a` (dark jungle sky)
- Player: `#CC3333` (red)
- Rope: `#CCCCCC` (light gray)
- Ceiling/canopy: `#0a2010` — `#123a1c` (dark greens, layered)
- Ground/brush: `#1a4015` — `#2e6a24` (olive greens, layered)

## Biome System
- 6 biome palettes cycle every 1000 distance units:
  1. Jungle (greens)
  2. Autumn (oranges/browns)
  3. Desert (sandy yellows)
  4. Night (deep blues)
  5. Ice (cool grays)
  6. Volcanic (reds/darks)
- Colors transition as the player progresses, rewarding distance

## Rope Inventory
- Player starts with 15 ropes (`STARTING_ROPES`)
- Each rope fire costs 1 rope
- Cannot fire when ropes reach 0
- Gold replenishment boxes (`#CCAA33`) spawn every ~250-350px
- Each box grants +5 ropes (`BOX_ROPES`)
- Boxes are positioned within the valid swing arc (y: 28–102px)
- Rope count displayed top-left with a small rope icon

## Rope Rendering (Atari 2600 Style)
- Rope drawn scanline-by-scanline (1px tall per step)
- Each segment is 2px wide, snapped to 160px horizontal grid (matching Atari's resolution)
- Mimics the Atari 2600 "ball" graphics object used for vines in Pitfall

## Distance & Game Over
- Bitmap 3x5 pixel digit font, rendered top-right during gameplay
- Distance measured from pedestal start in world units
- Game over triggers on ground collision — final distance shown centered large
- Blinking restart indicator appears below the score
- Any input restarts the game (resets position, ropes, boxes, biome)

## Tuning Constants
Located at the top of `game.js`:
- `GRAVITY`: 0.15 (downward acceleration per frame)
- `MAX_ROPE_LENGTH`: 140 (max distance from ceiling to fire rope)
- `PLAYER_SIZE`: 8 (red square dimensions)
- `CEILING_Y`: 8 (ceiling position from top)
- `GROUND_Y`: H - 12 (ground position from top)
- `ROPE_ANGLE`: 45 (degrees from horizontal — lower = more forward)
- `ATTACH_SPEED_BOOST`: 0.5 (forward speed gained per rope attach)
- `MAX_SPEED`: 6 (speed cap)
- `STARTING_ROPES`: 15 (initial rope supply)
- `BOX_ROPES`: 5 (ropes gained per pickup)
- `BOX_SPACING`: 250 (base distance between boxes)
- `BOX_SIZE`: 6 (pickup square dimensions)
- `BIOME_INTERVAL`: 1000 (distance units per biome change)
- Rope length multiplier: 0.6 (in `fireRope()` — fraction of actual distance)
- First rope multiplier: 0.9 (longer for gentle pedestal lift-off)
- Pedestal: 70px tall, 20px wide at x=50

## Current Status
- [x] Project setup (HTML/CSS/Canvas)
- [x] Retro pixel rendering
- [x] Gravity and freefall physics
- [x] Rope/pendulum swing mechanic
- [x] Camera scrolling
- [x] Ground and ceiling collision
- [x] Single-button input (keyboard, mouse, touch)
- [x] Pedestal starting point
- [x] Diagonal rope (up and to the right, 45°)
- [x] Shortened rope for tighter swings
- [x] Forward speed boost on attach (capped)
- [x] Parallax jungle background (6 layers, Jungle Hunt style)
- [x] Smooth camera follow (lerp)
- [x] Distance tracker (bitmap digits, top-right)
- [x] Biome color cycling (6 biomes every 1000 units)
- [x] Game over / restart on ground touch
- [x] Atari 2600-style rope rendering (scanline ball pixels)
- [x] Limited rope inventory (15 starting, decrements on use)
- [x] Rope replenishment boxes (gold pickups, +5 each)
- [ ] Obstacles or terrain variety
- [ ] Sound effects

## Key Decisions
- Single file (`game.js`) for all logic since the scope is small
- No module system - keeps it simple and server-free
- Constraint-based pendulum (position correction + velocity projection) rather than angular ODE - more stable and simpler to implement
- Hold-to-attach, release-to-detach control scheme for intuitive feel
- Diagonal rope angle gives natural forward momentum without artificial boosts
- Shortened rope (60%) prevents deep drops while keeping swings satisfying
- First rope uses 0.9 factor for a gentle lift off the pedestal
- Pedestal start gives the player time to understand the mechanic before physics kick in
- Lerp camera prevents parallax jumps when rope constraint yanks the player
- Seeded random for parallax shapes so the jungle stays consistent as you scroll back/forth
- Box Y positions capped to swing arc range so they're always reachable
- Gold color for pickups provides clear visual contrast against all biome palettes
