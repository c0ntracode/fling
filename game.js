// Fling - retro grappling game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Retro resolution (scaled up via CSS)
const W = 320;
const H = 180;
canvas.width = W;
canvas.height = H;

// World constants
const GRAVITY = 0.15;
const CEILING_Y = 8;
const GROUND_Y = H - 12;
const MAX_ROPE_LENGTH = 140;
const PLAYER_SIZE = 8;
const ROPE_ANGLE = 45; // degrees from horizontal (up and to the right)
const ROPE_FORWARD = 1 / Math.tan(ROPE_ANGLE * Math.PI / 180); // horizontal ratio

// Pedestal (starting platform)
const PEDESTAL = {
    x: 50,
    y: GROUND_Y - 70,
    width: 20,
    height: 70
};

// Rope inventory
const STARTING_ROPES = 15;
const BOX_ROPES = 5;         // ropes gained per pickup
const BOX_SPACING = 250;     // distance between boxes
const BOX_SIZE = 6;

// Player state
const player = {
    x: PEDESTAL.x + PEDESTAL.width / 2,
    y: PEDESTAL.y - PLAYER_SIZE / 2,
    vx: 0,
    vy: 0,
    attached: false,
    anchor: { x: 0, y: CEILING_Y },
    ropeLength: 0,
    started: false,
    ropes: STARTING_ROPES
};

let gameOver = false;
let finalDistance = 0;
let frameCount = 0;

// Rope replenishment boxes
let boxes = [];
let nextBoxX = 300; // first box distance from start

function spawnBoxes() {
    // Generate boxes ahead of the player
    while (nextBoxX < player.x + W * 2) {
        const seed = nextBoxX * 17;
        const r = seededRandom(seed);
        // Position within reachable swing arc
        // Player swings with shortened rope (0.6 factor), max rope = 140
        // Deepest swing point: CEILING_Y + MAX_ROPE_LENGTH * 0.6 = ~92px
        const minY = CEILING_Y + 20;
        const maxY = CEILING_Y + Math.floor(MAX_ROPE_LENGTH * 0.6) + 10;
        const y = minY + r * (maxY - minY);

        boxes.push({ x: nextBoxX, y: y, collected: false });
        nextBoxX += BOX_SPACING + seededRandom(seed + 1) * 100;
    }

    // Remove boxes far behind camera
    boxes = boxes.filter(b => b.x > cameraX - 50);
}

function checkBoxCollision() {
    for (const box of boxes) {
        if (box.collected) continue;
        const dx = player.x - box.x;
        const dy = player.y - box.y;
        if (Math.abs(dx) < (PLAYER_SIZE + BOX_SIZE) / 2 &&
            Math.abs(dy) < (PLAYER_SIZE + BOX_SIZE) / 2) {
            box.collected = true;
            player.ropes += BOX_ROPES;
        }
    }
}

function resetGame() {
    player.x = PEDESTAL.x + PEDESTAL.width / 2;
    player.y = PEDESTAL.y - PLAYER_SIZE / 2;
    player.vx = 0;
    player.vy = 0;
    player.attached = false;
    player.started = false;
    player.ropeLength = 0;
    cameraX = 0;
    gameOver = false;
    finalDistance = 0;
    player.ropes = STARTING_ROPES;
    boxes = [];
    nextBoxX = 300;
    updateBiome();
}

// Camera
let cameraX = 0;

// Input
let buttonDown = false;

// Biome palettes
const BIOMES = [
    { // Jungle
        bg: '#1a3a2a',
        ceiling: '#0a2010',
        canopyFar: '#0d2815', canopyMid: '#0f3018', canopyNear: '#123a1c',
        ground: '#2a5a20', groundDark: '#1a4015',
        brushFar: '#1e4a1a', brushMid: '#245a1e', brushNear: '#2e6a24'
    },
    { // Autumn
        bg: '#3a2a1a',
        ceiling: '#2a1508',
        canopyFar: '#4a2510', canopyMid: '#5a3015', canopyNear: '#6a3a1a',
        ground: '#5a4020', groundDark: '#3a2810',
        brushFar: '#4a3518', brushMid: '#5a4020', brushNear: '#6a4a28'
    },
    { // Desert
        bg: '#4a3a28',
        ceiling: '#6a5530',
        canopyFar: '#5a4828', canopyMid: '#6a5530', canopyNear: '#7a6038',
        ground: '#8a7040', groundDark: '#5a4828',
        brushFar: '#6a5530', brushMid: '#7a6038', brushNear: '#8a7040'
    },
    { // Night
        bg: '#0a0a2a',
        ceiling: '#050518',
        canopyFar: '#0a0820', canopyMid: '#0f0d28', canopyNear: '#141230',
        ground: '#1a1840', groundDark: '#0a0828',
        brushFar: '#121035', brushMid: '#18153a', brushNear: '#1e1a42'
    },
    { // Ice
        bg: '#1a2a3a',
        ceiling: '#2a3a4a',
        canopyFar: '#3a4a5a', canopyMid: '#4a5a6a', canopyNear: '#5a6a7a',
        ground: '#5a6a7a', groundDark: '#3a4a5a',
        brushFar: '#4a5a6a', brushMid: '#5a6a7a', brushNear: '#6a7a8a'
    },
    { // Volcanic
        bg: '#2a0a0a',
        ceiling: '#1a0505',
        canopyFar: '#2a0808', canopyMid: '#3a0c0c', canopyNear: '#4a1010',
        ground: '#4a2010', groundDark: '#2a0a08',
        brushFar: '#3a1510', brushMid: '#4a1a12', brushNear: '#5a2015'
    },
    { // Cotton Candy
        bg: '#3a2038',
        ceiling: '#2a1028',
        canopyFar: '#4a2848', canopyMid: '#583050', canopyNear: '#683858',
        ground: '#285868', groundDark: '#184858',
        brushFar: '#205060', brushMid: '#285868', brushNear: '#306070'
    },
    { // Synthwave
        bg: '#1a0030',
        ceiling: '#0a0018',
        canopyFar: '#30005a', canopyMid: '#400070', canopyNear: '#500088',
        ground: '#e02080', groundDark: '#a01060',
        brushFar: '#c01870', brushMid: '#d01a78', brushNear: '#e02080'
    },
    { // Ocean
        bg: '#0a2a3a',
        ceiling: '#083040',
        canopyFar: '#0a3848', canopyMid: '#0c4050', canopyNear: '#104858',
        ground: '#20a090', groundDark: '#108070',
        brushFar: '#189080', brushMid: '#20a090', brushNear: '#28b0a0'
    },
    { // Sunset
        bg: '#4a2040',
        ceiling: '#301030',
        canopyFar: '#5a2848', canopyMid: '#6a3050', canopyNear: '#7a3858',
        ground: '#e08030', groundDark: '#c06020',
        brushFar: '#d07028', brushMid: '#e08030', brushNear: '#f09038'
    },
    { // Lavender
        bg: '#d8d0e8',
        ceiling: '#b8a8d0',
        canopyFar: '#c0b0d8', canopyMid: '#c8b8e0', canopyNear: '#d0c0e8',
        ground: '#e8e0b8', groundDark: '#d0c8a0',
        brushFar: '#d8d0a8', brushMid: '#e0d8b0', brushNear: '#e8e0b8'
    },
    { // Bubblegum
        bg: '#38182a',
        ceiling: '#280c1a',
        canopyFar: '#482038', canopyMid: '#582840', canopyNear: '#683048',
        ground: '#1a5038', groundDark: '#103828',
        brushFar: '#184830', brushMid: '#1a5038', brushNear: '#205840'
    }
];

const BIOME_INTERVAL = 2000; // distance units per biome change

// Active colors (updated based on distance)
const COLORS = {
    ...BIOMES[0],
    player: '#CC3333',
    rope: '#CCCCCC'
};

function updateBiome() {
    const distance = Math.max(0, player.x - PEDESTAL.x);
    const biomeIndex = Math.floor(distance / BIOME_INTERVAL) % BIOMES.length;
    const biome = BIOMES[biomeIndex];

    COLORS.bg = biome.bg;
    COLORS.ceiling = biome.ceiling;
    COLORS.canopyFar = biome.canopyFar;
    COLORS.canopyMid = biome.canopyMid;
    COLORS.canopyNear = biome.canopyNear;
    COLORS.ground = biome.ground;
    COLORS.groundDark = biome.groundDark;
    COLORS.brushFar = biome.brushFar;
    COLORS.brushMid = biome.brushMid;
    COLORS.brushNear = biome.brushNear;
}

// Parallax layers (generated procedurally based on world position)
const PARALLAX = {
    // Canopy layers (top)
    canopy: [
        { speed: 0.2, color: 'canopyFar', minH: 10, maxH: 25, spacing: 40 },
        { speed: 0.5, color: 'canopyMid', minH: 8, maxH: 18, spacing: 30 },
        { speed: 0.8, color: 'canopyNear', minH: 5, maxH: 14, spacing: 25 }
    ],
    // Brush layers (bottom)
    brush: [
        { speed: 0.2, color: 'brushFar', minH: 8, maxH: 20, spacing: 45 },
        { speed: 0.5, color: 'brushMid', minH: 6, maxH: 16, spacing: 35 },
        { speed: 0.8, color: 'brushNear', minH: 4, maxH: 12, spacing: 20 }
    ]
};

// Bitmap digits (3x5 pixel grids, 1 = filled)
const DIGITS = [
    [1,1,1, 1,0,1, 1,0,1, 1,0,1, 1,1,1], // 0
    [0,1,0, 1,1,0, 0,1,0, 0,1,0, 1,1,1], // 1
    [1,1,1, 0,0,1, 1,1,1, 1,0,0, 1,1,1], // 2
    [1,1,1, 0,0,1, 1,1,1, 0,0,1, 1,1,1], // 3
    [1,0,1, 1,0,1, 1,1,1, 0,0,1, 0,0,1], // 4
    [1,1,1, 1,0,0, 1,1,1, 0,0,1, 1,1,1], // 5
    [1,1,1, 1,0,0, 1,1,1, 1,0,1, 1,1,1], // 6
    [1,1,1, 0,0,1, 0,0,1, 0,0,1, 0,0,1], // 7
    [1,1,1, 1,0,1, 1,1,1, 1,0,1, 1,1,1], // 8
    [1,1,1, 1,0,1, 1,1,1, 0,0,1, 1,1,1]  // 9
];
const DIGIT_W = 3;
const DIGIT_H = 5;
const DIGIT_SCALE = 2; // pixel size for each bit
const DIGIT_GAP = 1;   // gap between digits in pixels

function drawNumber(num, x, y, color) {
    const str = String(Math.floor(num));
    ctx.fillStyle = color;
    for (let c = 0; c < str.length; c++) {
        const d = parseInt(str[c]);
        const grid = DIGITS[d];
        const offsetX = c * (DIGIT_W * DIGIT_SCALE + DIGIT_GAP);
        for (let row = 0; row < DIGIT_H; row++) {
            for (let col = 0; col < DIGIT_W; col++) {
                if (grid[row * DIGIT_W + col]) {
                    ctx.fillRect(
                        x + offsetX + col * DIGIT_SCALE,
                        y + row * DIGIT_SCALE,
                        DIGIT_SCALE,
                        DIGIT_SCALE
                    );
                }
            }
        }
    }
}

// Simple seeded random for consistent parallax shapes
function seededRandom(seed) {
    const x = Math.sin(seed * 127.1) * 43758.5453;
    return x - Math.floor(x);
}

function init() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'KeyZ') {
            e.preventDefault();
            if (!buttonDown) fireRope();
            buttonDown = true;
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'KeyZ') {
            releaseRope();
            buttonDown = false;
        }
    });

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (!buttonDown) fireRope();
        buttonDown = true;
    });

    canvas.addEventListener('mouseup', () => {
        releaseRope();
        buttonDown = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (!buttonDown) fireRope();
        buttonDown = true;
    });

    canvas.addEventListener('touchend', () => {
        releaseRope();
        buttonDown = false;
    });

    loop();
}

const ATTACH_SPEED_BOOST = 0.5; // forward speed boost on attach
const MAX_SPEED = 6; // cap so it doesn't grow forever

function fireRope() {
    if (gameOver) {
        resetGame();
        return;
    }

    // Can't fire if out of ropes
    if (player.ropes <= 0) return;

    // Rope fires up and to the right at ROPE_ANGLE
    const distToCeiling = player.y - CEILING_Y;
    const forwardOffset = distToCeiling * ROPE_FORWARD;
    const ropeLength = Math.sqrt(distToCeiling * distToCeiling + forwardOffset * forwardOffset);

    if (ropeLength <= MAX_ROPE_LENGTH) {
        player.attached = true;
        player.anchor.x = player.x + forwardOffset;
        player.anchor.y = CEILING_Y;
        // First rope is longer for a gentle lift off the pedestal
        const ropeFactor = player.started ? 0.6 : 0.9;
        player.ropeLength = ropeLength * ropeFactor;
        player.started = true;
        player.ropes--;

        // Forward speed boost, capped
        if (player.vx < MAX_SPEED) {
            player.vx = Math.min(player.vx + ATTACH_SPEED_BOOST, MAX_SPEED);
        }
    }
}

function releaseRope() {
    player.attached = false;
}

function update() {
    frameCount++;

    // Don't move until player fires first rope
    if (!player.started || gameOver) return;

    if (player.attached) {
        // Pendulum physics via constraint
        // Apply gravity
        player.vy += GRAVITY;

        // Update position
        player.x += player.vx;
        player.y += player.vy;

        // Constrain to rope length
        const dx = player.x - player.anchor.x;
        const dy = player.y - player.anchor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > player.ropeLength) {
            // Push player back to rope length
            const nx = dx / dist;
            const ny = dy / dist;

            player.x = player.anchor.x + nx * player.ropeLength;
            player.y = player.anchor.y + ny * player.ropeLength;

            // Remove velocity component along rope (keep tangential)
            const velDotNorm = player.vx * nx + player.vy * ny;
            if (velDotNorm > 0) {
                player.vx -= velDotNorm * nx;
                player.vy -= velDotNorm * ny;
            }
        }
    } else {
        // Freefall
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;
    }

    // Ground collision
    if (player.y + PLAYER_SIZE / 2 >= GROUND_Y) {
        player.y = GROUND_Y - PLAYER_SIZE / 2;
        player.vy = 0;
        player.vx = 0;
        player.attached = false;

        if (player.started) {
            gameOver = true;
            finalDistance = Math.max(0, Math.floor(player.x - PEDESTAL.x));
        }
    }

    // Ceiling collision
    if (player.y - PLAYER_SIZE / 2 <= CEILING_Y) {
        player.y = CEILING_Y + PLAYER_SIZE / 2;
        if (player.vy < 0) player.vy = 0;
    }

    // Smooth camera follow (lerp)
    const targetCameraX = player.x - W * 0.3;
    cameraX += (targetCameraX - cameraX) * 0.08;

    // Update biome colors based on distance
    updateBiome();

    // Spawn and check rope replenishment boxes
    spawnBoxes();
    checkBoxCollision();
}

function drawParallaxLayer(layer, isTop) {
    const parallaxOffset = cameraX * layer.speed;
    const startTile = Math.floor(parallaxOffset / layer.spacing);
    const tilesOnScreen = Math.ceil(W / layer.spacing) + 2;

    ctx.fillStyle = COLORS[layer.color];

    for (let i = startTile; i < startTile + tilesOnScreen; i++) {
        const seed = i * 31 + (isTop ? 0 : 1000);
        const r = seededRandom(seed);
        const h = layer.minH + r * (layer.maxH - layer.minH);
        const w = layer.spacing * (0.5 + seededRandom(seed + 1) * 0.5);
        const screenX = i * layer.spacing - parallaxOffset;

        if (isTop) {
            ctx.fillRect(Math.floor(screenX), 0, Math.ceil(w), Math.floor(h));
        } else {
            ctx.fillRect(Math.floor(screenX), Math.floor(GROUND_Y + 2 - h), Math.ceil(w), Math.floor(h) + (H - GROUND_Y));
        }
    }
}

function render() {
    // Clear with jungle sky
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    const offsetX = -cameraX;

    // Draw canopy parallax layers (back to front)
    for (const layer of PARALLAX.canopy) {
        drawParallaxLayer(layer, true);
    }

    // Draw ceiling base
    ctx.fillStyle = COLORS.ceiling;
    ctx.fillRect(0, 0, W, CEILING_Y);

    // Draw ground base
    ctx.fillStyle = COLORS.groundDark;
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

    // Draw brush parallax layers (back to front)
    for (const layer of PARALLAX.brush) {
        drawParallaxLayer(layer, false);
    }

    // Draw ground surface line
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y, W, 2);

    // Draw pedestal
    const pedScreenX = PEDESTAL.x + offsetX;
    if (pedScreenX + PEDESTAL.width > 0 && pedScreenX < W) {
        ctx.fillStyle = COLORS.ceiling;
        ctx.fillRect(
            Math.floor(pedScreenX),
            PEDESTAL.y,
            PEDESTAL.width,
            PEDESTAL.height
        );
    }

    // Draw rope replenishment boxes
    ctx.fillStyle = '#CCAA33'; // gold/yellow pickup color
    for (const box of boxes) {
        if (box.collected) continue;
        const bx = Math.floor(box.x + offsetX - BOX_SIZE / 2);
        const by = Math.floor(box.y - BOX_SIZE / 2);
        if (bx + BOX_SIZE > 0 && bx < W) {
            ctx.fillRect(bx, by, BOX_SIZE, BOX_SIZE);
        }
    }

    // Draw rope (Atari 2600 style: 1-pixel ball, 160x192 NTSC)
    // Atari pixels were ~2x wide on our 320-wide canvas, 1px tall
    if (player.attached) {
        const ax = player.anchor.x + offsetX;
        const ay = player.anchor.y;
        const px = player.x + offsetX;
        const py = player.y;

        ctx.fillStyle = COLORS.rope;

        // Step vertically one pixel at a time (like the Atari scanlines)
        const startY = Math.floor(Math.min(ay, py));
        const endY = Math.floor(Math.max(ay, py));

        for (let y = startY; y <= endY; y++) {
            // Interpolate x position at this scanline
            const t = (endY === startY) ? 0 : (y - ay) / (py - ay);
            const x = Math.floor((ax + (px - ax) * t) / 2) * 2; // snap to 2px grid (160→320)
            ctx.fillRect(x, y, 2, 1);
        }
    }

    // Draw player
    const screenX = player.x + offsetX;
    const screenY = player.y;
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(
        Math.floor(screenX - PLAYER_SIZE / 2),
        Math.floor(screenY - PLAYER_SIZE / 2),
        PLAYER_SIZE,
        PLAYER_SIZE
    );

    // Draw distance counter (top-right)
    if (player.started && !gameOver) {
        const distance = Math.max(0, Math.floor(player.x - PEDESTAL.x));
        const numStr = String(distance);
        const numWidth = numStr.length * (DIGIT_W * DIGIT_SCALE + DIGIT_GAP) - DIGIT_GAP;
        drawNumber(distance, W - numWidth - 4, 4, '#CCCCCC');
    }

    // Draw rope count (top-left)
    if (!gameOver) {
        // Small rope icon (2px wide, 6px tall line)
        ctx.fillStyle = '#CCCCCC';
        ctx.fillRect(4, 12, 2, 6);
        // Rope count number next to it
        drawNumber(player.ropes, 8, 12, '#CCAA33');
    }

    // Game over screen
    if (gameOver) {
        // Darken overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // Show final distance (centered, large)
        const numStr = String(finalDistance);
        const largeScale = 4;
        const largeGap = 2;
        const numWidth = numStr.length * (DIGIT_W * largeScale + largeGap) - largeGap;
        const numX = Math.floor((W - numWidth) / 2);
        const numY = Math.floor(H / 2 - DIGIT_H * largeScale / 2 - 10);

        // Draw large distance
        ctx.fillStyle = '#CCCCCC';
        for (let c = 0; c < numStr.length; c++) {
            const d = parseInt(numStr[c]);
            const grid = DIGITS[d];
            const ox = numX + c * (DIGIT_W * largeScale + largeGap);
            for (let row = 0; row < DIGIT_H; row++) {
                for (let col = 0; col < DIGIT_W; col++) {
                    if (grid[row * DIGIT_W + col]) {
                        ctx.fillRect(ox + col * largeScale, numY + row * largeScale, largeScale, largeScale);
                    }
                }
            }
        }

        // Blinking "press to restart" indicator
        if (Math.floor(frameCount / 30) % 2 === 0) {
            const restartY = numY + DIGIT_H * largeScale + 12;
            const dotSize = 3;
            const totalW = dotSize * 5;
            const dotX = Math.floor((W - totalW) / 2);
            ctx.fillStyle = COLORS.player;
            // Simple blinking bar
            ctx.fillRect(dotX, restartY, totalW, dotSize);
        }
    }
}

function loop() {
    update();
    render();
    requestAnimationFrame(loop);
}

init();
