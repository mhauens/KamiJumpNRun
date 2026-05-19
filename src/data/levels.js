const BOSS_DEFAULTS = {
    playerHp: null,
    hp: null,
    speed: 110,
    attackCooldown: 1350,
    projectileRange: 360,
    projectileSpeed: 280,
    shotOffsetX: 58,
    shotOffsetY: -104,
    shotScale: 0.18,
    shotBodyWidth: 34,
    shotBodyHeight: 18,
    scaleMultiplier: 1,
    defeatedScaleMultiplier: 2.75,
    defeatedFootSink: 108,
    damage: 1,
    dodgeChance: 0.35,
    dodgeCooldown: 1800,
    dodgeDuration: 200,
    dodgeSpeed: 650,
    dodgeAttackCooldown: 950,
    dodgeContactCooldown: 950,
    enrageHealthRatio: 0.25,
    enrageSpeedMultiplier: 1.32,
    enrageCooldownMultiplier: 0.68,
    enrageProjectileSpeedMultiplier: 1.22,
    enrageDodgeChanceBonus: 0.2,
    enrageSpecialAttackChanceBonus: 0.24,
    enrageCardSpreadAttackChanceBonus: 0.24,
    enrageChargeAttackChanceBonus: 0.2,
}
const BOSS_ARENA_AFTER_PICKUP_PADDING = 180
const BOSS_ARENA_WIDTH = 1280
const BOSS_ARENA_EXIT_PADDING = 140
const BOSS_ARENA_GROUND_HEIGHT = 260
const BOSS_HP_PLAYTIME_MULTIPLIER = 1.9
const CHASM_PLATFORM_EDGE_OVERLAP = 20
const CHECKPOINT_PLATFORM_INSET = 70
const CHECKPOINT_PLATFORM_SNAP_DISTANCE = 96
const CHECKPOINT_TEXTURE_HEIGHT = 56
const MARATHON_STRETCH_START_GAP = 520
const MARATHON_STRETCH_SEGMENT_COUNT = 18
const MARATHON_STRETCH_SEGMENT_STEP = 780

const MARATHON_STRETCH_VARIANTS = [
    {
        groundOffsets: [-20, -90, 25, -145, -55, 10],
        highOffsets: [-150, -155, -145, -160, -150, -155],
        highXOffsets: [390, 390, 390, 390, 390, 390],
        groundWidths: [220, 260, 220],
        narrowWidths: [88, 96, 84, 104, 92, 100],
        movingEvery: 4,
        movingRemainder: 1,
        movingXOffset: 520,
        movingYOffset: -115,
        movingDistanceBase: 150,
        ballEvery: 5,
        ballRemainder: 2,
        checkpointEvery: 4,
        checkpointRemainder: 0,
        finalGroundOffset: -40,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
    {
        groundOffsets: [-120, -35, -165, 20, -75, -10],
        highOffsets: [-120, -160, -135, -165, -125, -155],
        highXOffsets: [360, 405, 375, 430, 365, 395],
        groundWidths: [250, 210, 290, 220],
        narrowWidths: [112, 86, 118, 92, 104, 90],
        movingEvery: 3,
        movingRemainder: 2,
        movingXOffset: 500,
        movingYOffset: -135,
        movingDistanceBase: 115,
        ballEvery: 6,
        ballRemainder: 4,
        checkpointEvery: 5,
        checkpointRemainder: 0,
        finalGroundOffset: -95,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
    {
        groundOffsets: [15, -140, -45, -160, 10, -105],
        highOffsets: [-165, -130, -165, -140, -160, -125],
        highXOffsets: [415, 365, 425, 370, 405, 360],
        groundWidths: [205, 235, 275, 215],
        narrowWidths: [82, 126, 88, 118, 94, 110],
        movingEvery: 4,
        movingRemainder: 0,
        movingXOffset: 545,
        movingYOffset: -95,
        movingDistanceBase: 170,
        ballEvery: 5,
        ballRemainder: 1,
        checkpointEvery: 4,
        checkpointRemainder: 2,
        finalGroundOffset: 5,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
    {
        groundOffsets: [-55, -165, -15, -110, -145, 35],
        highOffsets: [-140, -150, -165, -130, -160, -145],
        highXOffsets: [370, 440, 390, 360, 420, 380],
        groundWidths: [280, 225, 245, 210],
        narrowWidths: [100, 96, 132, 84, 108, 90],
        movingEvery: 5,
        movingRemainder: 3,
        movingXOffset: 515,
        movingYOffset: -145,
        movingDistanceBase: 135,
        ballEvery: 4,
        ballRemainder: 3,
        checkpointEvery: 3,
        checkpointRemainder: 0,
        finalGroundOffset: -120,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
    {
        groundOffsets: [-150, -70, 0, -130, -30, -175],
        highOffsets: [-115, -160, -150, -165, -125, -165],
        highXOffsets: [350, 400, 455, 375, 435, 390],
        groundWidths: [240, 300, 215, 255],
        narrowWidths: [128, 92, 86, 122, 100, 112],
        movingEvery: 3,
        movingRemainder: 1,
        movingXOffset: 560,
        movingYOffset: -120,
        movingDistanceBase: 95,
        ballEvery: 6,
        ballRemainder: 0,
        checkpointEvery: 4,
        checkpointRemainder: 1,
        finalGroundOffset: -60,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
    {
        groundOffsets: [-90, -20, -155, -65, -185, -70],
        highOffsets: [-165, -125, -160, -165, -135, -165],
        highXOffsets: [430, 360, 405, 445, 370, 415],
        groundWidths: [215, 275, 230, 295],
        narrowWidths: [90, 116, 104, 88, 130, 96],
        movingEvery: 4,
        movingRemainder: 2,
        movingXOffset: 500,
        movingYOffset: -145,
        movingDistanceBase: 150,
        ballEvery: 5,
        ballRemainder: 4,
        checkpointEvery: 5,
        checkpointRemainder: 2,
        finalGroundOffset: -145,
        entryBridge: [
            { xOffset: -360, yOffset: -70, width: 108 },
            { xOffset: -190, yOffset: -50, width: 108 },
        ],
    },
]

const MANDATORY_CHASMS = {
    1: [
        { edgeX: 1435, rightX: 1585, gapWidth: 460, y: 650, platformWidth: 120, speed: 72 },
        { edgeX: 4500, rightX: 4610, gapWidth: 500, y: 650, platformWidth: 118, speed: 82 },
    ],
    2: [
        { edgeX: 1460, rightX: 1600, gapWidth: 500, y: 545, platformWidth: 116, speed: 82 },
        { edgeX: 5070, rightX: 5195, gapWidth: 540, y: 655, platformWidth: 112, speed: 92 },
    ],
    3: [
        { edgeX: 1265, rightX: 1390, gapWidth: 520, y: 660, platformWidth: 108, speed: 88 },
        { edgeX: 5810, rightX: 5990, gapWidth: 580, y: 560, platformWidth: 106, speed: 100 },
    ],
    4: [
        { edgeX: 670, rightX: 820, gapWidth: 500, y: 590, platformWidth: 108, speed: 88 },
        { edgeX: 5720, rightX: 5925, gapWidth: 580, y: 555, platformWidth: 104, speed: 102 },
    ],
    5: [
        { edgeX: 575, rightX: 720, gapWidth: 520, y: 585, platformWidth: 104, speed: 96 },
        { edgeX: 6040, rightX: 6235, gapWidth: 600, y: 610, platformWidth: 100, speed: 108 },
    ],
    6: [
        { edgeX: 595, rightX: 745, gapWidth: 540, y: 570, platformWidth: 100, speed: 100 },
        { edgeX: 6935, rightX: 7070, gapWidth: 620, y: 585, platformWidth: 96, speed: 116 },
    ],
}

function createBossAudioConfig(levelId, overrides = {}) {
    return {
        splash: {
            key: `boss-${levelId}-splash-audio`,
            urls: [],
            volume: 1,
            ...(overrides.splash ?? {}),
        },
        retrySplash: {
            key: `boss-${levelId}-retry-splash-audio`,
            urls: [],
            volume: 1,
            ...(overrides.retrySplash ?? {}),
        },
    }
}

function scaleBossHpForPlaytime(boss) {
    const scaleHp = (hp) => (
        Number.isFinite(hp)
            ? Math.round(hp * BOSS_HP_PLAYTIME_MULTIPLIER)
            : hp
    )

    return {
        ...boss,
        hp: scaleHp(boss.hp),
        phase2: boss.phase2
            ? {
                ...boss.phase2,
                hp: scaleHp(boss.phase2.hp),
            }
            : boss.phase2,
    }
}

function withBossDefaults(level) {
    const lastPickupX = Math.max(
        ...level.coins.map((entry) => entry.x),
        ...level.balls.map((entry) => entry.x),
    )
    const originalGoalBottom = level.goal.y + level.goal.height
    const arenaLeft = lastPickupX + BOSS_ARENA_AFTER_PICKUP_PADDING
    const arenaRight = arenaLeft + BOSS_ARENA_WIDTH
    const goal = {
        ...level.goal,
        x: arenaRight + BOSS_ARENA_EXIT_PADDING,
        y: originalGoalBottom - level.goal.height,
    }
    const worldWidth = Math.max(
        level.worldWidth,
        goal.x + BOSS_ARENA_EXIT_PADDING,
    )
    const arenaFloor = {
        x: arenaLeft,
        y: originalGoalBottom,
        width: goal.x + 80 - arenaLeft,
        height: Math.max(
            level.worldHeight - originalGoalBottom,
            BOSS_ARENA_GROUND_HEIGHT,
        ),
    }
    const platforms = level.platforms.filter((platform) => {
        const platformRight = platform.x + platform.width
        const overlapsArena =
            platform.x < goal.x + 80 && platformRight > arenaLeft

        return !overlapsArena
    })
    const boss = scaleBossHpForPlaytime({
        ...BOSS_DEFAULTS,
        ...(level.boss ?? {}),
        audio: createBossAudioConfig(level.id, level.boss?.audio),
        triggerX: arenaLeft - 40,
        arenaLeft,
        arenaRight,
        floorY: originalGoalBottom,
        respawnX: arenaRight - 90,
        playerStart: { x: arenaLeft + 120, y: originalGoalBottom },
        spawn: {
            x: arenaRight - 180,
            y: originalGoalBottom - level.goal.height,
        },
        checkpoint: {
            x: arenaLeft - 140,
            y: originalGoalBottom - level.goal.height,
            label: "Boss Checkpoint",
        },
    })

    return {
        ...level,
        worldWidth,
        platforms: [...platforms, arenaFloor],
        goal,
        boss,
    }
}

const PRE_BOSS_EXTENSIONS = {
    1: {
        platforms: [
            { x: 2760, y: 650, width: 250, height: 250 },
            { x: 3160, y: 560, width: 210, height: 340 },
            { x: 3900, y: 590, width: 240, height: 310 },
            { x: 3345, y: 390, width: 96, height: 28 },
            { x: 3715, y: 480, width: 105, height: 28 },
            { x: 4610, y: 585, width: 220, height: 315 },
            { x: 4970, y: 510, width: 205, height: 390 },
            { x: 5690, y: 570, width: 250, height: 330 },
            { x: 4350, y: 500, width: 100, height: 28 },
            { x: 4745, y: 425, width: 95, height: 28 },
            { x: 5130, y: 355, width: 92, height: 28 },
            { x: 5530, y: 475, width: 105, height: 28 },
        ],
        movingPlatforms: [
            { x: 3010, y: 610, width: 130, height: 28, distance: 150, speed: 70 },
            { x: 4500, y: 650, width: 125, height: 28, distance: 110, speed: 76 },
        ],
        coins: [
            { x: 2860, y: 590 },
            { x: 2940, y: 590 },
            { x: 3075, y: 410 },
            { x: 3335, y: 360 },
            { x: 3260, y: 520 },
            { x: 3760, y: 450 },
            { x: 3980, y: 550 },
            { x: 4335, y: 460 },
            { x: 4450, y: 610 },
            { x: 4740, y: 390 },
            { x: 4990, y: 480 },
            { x: 5205, y: 330 },
            { x: 5800, y: 520 },
            { x: 5515, y: 440 },
            { x: 5900, y: 530 },
        ],
        balls: [
            { x: 3395, y: 335 },
            { x: 5175, y: 300 },
        ],
        checkpoints: [
            { x: 3610, y: 620, label: "Checkpoint 3" },
            { x: 5380, y: 600, label: "Checkpoint 4" },
        ],
    },
    2: {
        platforms: [
            { x: 3400, y: 655, width: 220, height: 265 },
            { x: 3765, y: 535, width: 210, height: 385 },
            { x: 4480, y: 580, width: 220, height: 340 },
            { x: 3620, y: 478, width: 95, height: 24 },
            { x: 3980, y: 400, width: 95, height: 24 },
            { x: 4325, y: 535, width: 105, height: 24 },
            { x: 4850, y: 650, width: 220, height: 270 },
            { x: 5195, y: 535, width: 205, height: 385 },
            { x: 5925, y: 590, width: 220, height: 330 },
            { x: 6285, y: 515, width: 220, height: 405 },
            { x: 5010, y: 475, width: 95, height: 24 },
            { x: 5360, y: 405, width: 95, height: 24 },
            { x: 5735, y: 505, width: 105, height: 24 },
            { x: 6120, y: 415, width: 95, height: 24 },
        ],
        movingPlatforms: [
            { x: 3620, y: 610, width: 120, height: 28, distance: 145, speed: 82 },
            { x: 4330, y: 655, width: 120, height: 28, distance: 150, speed: 88 },
        ],
        coins: [
            { x: 3480, y: 590 },
            { x: 3620, y: 430 },
            { x: 3820, y: 500 },
            { x: 3945, y: 370 },
            { x: 4385, y: 500 },
            { x: 4345, y: 460 },
            { x: 4560, y: 540 },
            { x: 4890, y: 580 },
            { x: 5010, y: 440 },
            { x: 5230, y: 500 },
            { x: 5320, y: 380 },
            { x: 5670, y: 470 },
            { x: 5730, y: 470 },
            { x: 5980, y: 550 },
            { x: 6105, y: 390 },
            { x: 6430, y: 480 },
        ],
        balls: [
            { x: 4025, y: 345 },
            { x: 5405, y: 350 },
        ],
        checkpoints: [
            { x: 4200, y: 640, label: "Checkpoint 3" },
            { x: 5600, y: 630, label: "Checkpoint 4" },
        ],
    },
    3: {
        platforms: [
            { x: 4200, y: 625, width: 200, height: 335 },
            { x: 4560, y: 515, width: 190, height: 445 },
            { x: 4890, y: 440, width: 195, height: 520 },
            { x: 5245, y: 635, width: 215, height: 325 },
            { x: 5605, y: 500, width: 205, height: 460 },
            { x: 4335, y: 430, width: 92, height: 24 },
            { x: 4760, y: 380, width: 88, height: 24 },
            { x: 5120, y: 365, width: 92, height: 24 },
            { x: 5465, y: 300, width: 88, height: 24 },
            { x: 5990, y: 600, width: 210, height: 360 },
            { x: 6335, y: 490, width: 205, height: 470 },
            { x: 6685, y: 675, width: 230, height: 285 },
            { x: 6490, y: 330, width: 88, height: 24 },
            { x: 6835, y: 545, width: 92, height: 24 },
        ],
        movingPlatforms: [
            { x: 4400, y: 570, width: 112, height: 28, distance: 160, speed: 88 },
            { x: 5810, y: 560, width: 112, height: 28, distance: 180, speed: 94 },
        ],
        coins: [
            { x: 4280, y: 560 },
            { x: 4450, y: 370 },
            { x: 4580, y: 480 },
            { x: 4760, y: 290 },
            { x: 4910, y: 400 },
            { x: 5110, y: 340 },
            { x: 5290, y: 550 },
            { x: 5420, y: 270 },
            { x: 5620, y: 460 },
            { x: 6010, y: 530 },
            { x: 6190, y: 540 },
            { x: 6330, y: 450 },
            { x: 6440, y: 300 },
            { x: 6700, y: 590 },
            { x: 6810, y: 460 },
        ],
        balls: [
            { x: 4804, y: 325 },
            { x: 5508, y: 245 },
            { x: 6534, y: 275 },
        ],
        checkpoints: [
            { x: 4955, y: 400, label: "Checkpoint 3" },
            { x: 6380, y: 450, label: "Checkpoint 4" },
        ],
    },
    4: {
        platforms: [
            { x: 4400, y: 605, width: 210, height: 375 },
            { x: 4770, y: 500, width: 195, height: 480 },
            { x: 5510, y: 640, width: 210, height: 340 },
            { x: 4630, y: 480, width: 92, height: 28 },
            { x: 4970, y: 330, width: 88, height: 28 },
            { x: 5350, y: 495, width: 100, height: 28 },
            { x: 5925, y: 600, width: 210, height: 380 },
            { x: 6275, y: 480, width: 195, height: 500 },
            { x: 6990, y: 580, width: 215, height: 400 },
            { x: 6070, y: 420, width: 92, height: 28 },
            { x: 6420, y: 350, width: 88, height: 28 },
            { x: 6800, y: 500, width: 100, height: 28 },
        ],
        movingPlatforms: [
            { x: 4610, y: 560, width: 108, height: 28, distance: 160, speed: 92 },
            { x: 5720, y: 555, width: 108, height: 28, distance: 205, speed: 98 },
        ],
        coins: [
            { x: 4480, y: 540 },
            { x: 4640, y: 450 },
            { x: 4820, y: 460 },
            { x: 4940, y: 300 },
            { x: 5075, y: 470 },
            { x: 5350, y: 460 },
            { x: 5580, y: 550 },
            { x: 5960, y: 530 },
            { x: 6060, y: 390 },
            { x: 6270, y: 440 },
            { x: 6370, y: 320 },
            { x: 6500, y: 450 },
            { x: 6785, y: 460 },
            { x: 7100, y: 540 },
        ],
        balls: [
            { x: 5014, y: 275 },
            { x: 6464, y: 295 },
        ],
        checkpoints: [
            { x: 5210, y: 630, label: "Checkpoint 3" },
            { x: 6660, y: 610, label: "Checkpoint 4" },
        ],
    },
    5: {
        platforms: [
            { x: 4720, y: 525, width: 185, height: 515 },
            { x: 5480, y: 545, width: 195, height: 495 },
            { x: 5825, y: 640, width: 215, height: 400 },
            { x: 4925, y: 390, width: 84, height: 28 },
            { x: 5285, y: 475, width: 92, height: 28 },
            { x: 5650, y: 380, width: 84, height: 28 },
            { x: 6235, y: 540, width: 195, height: 500 },
            { x: 6585, y: 680, width: 230, height: 360 },
            { x: 6960, y: 545, width: 215, height: 495 },
            { x: 7335, y: 645, width: 215, height: 395 },
            { x: 6380, y: 410, width: 84, height: 28 },
            { x: 6735, y: 475, width: 92, height: 28 },
            { x: 7100, y: 380, width: 84, height: 28 },
        ],
        movingPlatforms: [
            { x: 4905, y: 610, width: 104, height: 28, distance: 180, speed: 96 },
            { x: 6815, y: 610, width: 104, height: 28, distance: 145, speed: 104 },
        ],
        coins: [
            { x: 4800, y: 480 },
            { x: 4930, y: 360 },
            { x: 4860, y: 475 },
            { x: 5290, y: 440 },
            { x: 5480, y: 510 },
            { x: 5600, y: 350 },
            { x: 5870, y: 560 },
            { x: 6240, y: 500 },
            { x: 6360, y: 380 },
            { x: 6600, y: 590 },
            { x: 6710, y: 440 },
            { x: 6980, y: 510 },
            { x: 7040, y: 350 },
            { x: 7420, y: 560 },
        ],
        balls: [
            { x: 5692, y: 325 },
            { x: 7142, y: 325 },
        ],
        checkpoints: [
            { x: 5535, y: 510, label: "Checkpoint 3" },
            { x: 7000, y: 510, label: "Checkpoint 4" },
        ],
    },
    6: {
        platforms: [
            { x: 5280, y: 535, width: 185, height: 525 },
            { x: 5635, y: 620, width: 225, height: 440 },
            { x: 6025, y: 480, width: 185, height: 580 },
            { x: 6365, y: 610, width: 210, height: 450 },
            { x: 6725, y: 635, width: 210, height: 425 },
            { x: 5490, y: 400, width: 84, height: 28 },
            { x: 5855, y: 330, width: 84, height: 28 },
            { x: 6185, y: 375, width: 84, height: 28 },
            { x: 6545, y: 445, width: 92, height: 28 },
            { x: 7070, y: 520, width: 195, height: 540 },
            { x: 7425, y: 665, width: 225, height: 395 },
            { x: 7805, y: 500, width: 195, height: 560 },
            { x: 7210, y: 390, width: 84, height: 28 },
            { x: 7560, y: 475, width: 92, height: 28 },
            { x: 7895, y: 360, width: 84, height: 28 },
        ],
        movingPlatforms: [
            { x: 5860, y: 590, width: 100, height: 28, distance: 165, speed: 104 },
            { x: 6935, y: 585, width: 100, height: 28, distance: 135, speed: 112 },
        ],
        coins: [
            { x: 5360, y: 490 },
            { x: 5500, y: 370 },
            { x: 5700, y: 590 },
            { x: 5810, y: 300 },
            { x: 6040, y: 440 },
            { x: 6160, y: 345 },
            { x: 6380, y: 530 },
            { x: 6480, y: 410 },
            { x: 6700, y: 560 },
            { x: 7060, y: 480 },
            { x: 7180, y: 360 },
            { x: 7410, y: 580 },
            { x: 7520, y: 440 },
            { x: 7760, y: 460 },
            { x: 7820, y: 330 },
        ],
        balls: [
            { x: 5897, y: 275 },
            { x: 6591, y: 390 },
            { x: 7937, y: 305 },
        ],
        checkpoints: [
            { x: 6070, y: 440, label: "Checkpoint 4" },
            { x: 7780, y: 460, label: "Checkpoint 5" },
        ],
    },
}

function withPreBossExtension(level) {
    const extension = PRE_BOSS_EXTENSIONS[level.id]

    if (!extension) {
        return level
    }

    return {
        ...level,
        platforms: [...level.platforms, ...extension.platforms],
        movingPlatforms: [
            ...(level.movingPlatforms ?? []),
            ...(extension.movingPlatforms ?? []),
        ],
        fallingPlatforms: [
            ...(level.fallingPlatforms ?? []),
            ...(extension.fallingPlatforms ?? []),
        ],
        coins: [...level.coins, ...extension.coins],
        balls: [...level.balls, ...extension.balls],
        checkpoints: [...level.checkpoints, ...extension.checkpoints],
    }
}

function shiftPointAfter(point, thresholdX, deltaX) {
    if (point.x < thresholdX) {
        return point
    }

    return {
        ...point,
        x: point.x + deltaX,
    }
}

function shiftPlatformAfter(platform, thresholdX, deltaX) {
    if (platform.x < thresholdX) {
        return platform
    }

    return {
        ...platform,
        x: platform.x + deltaX,
    }
}

function trimPlatformAroundChasm(platform, leftX, rightX) {
    const platformRight = platform.x + platform.width

    if (platform.x >= rightX || platformRight <= leftX) {
        return platform
    }

    if (platform.x < leftX && platformRight > rightX) {
        return {
            ...platform,
            width: leftX - platform.x,
        }
    }

    if (platform.x < leftX) {
        return {
            ...platform,
            width: leftX - platform.x,
        }
    }

    if (platformRight > rightX) {
        return {
            ...platform,
            x: rightX,
            width: platformRight - rightX,
        }
    }

    return null
}

function hasNearbySupport(point, platforms) {
    return platforms.some((platform) => (
        point.x >= platform.x - 160 &&
        point.x <= platform.x + platform.width + 160 &&
        point.y < platform.y &&
        point.y >= platform.y - (platform.height >= 120 ? 180 : 160)
    ))
}

function movePickupsOutOfChasm(points, platforms, leftX, rightX, type) {
    let movedCount = 0
    const landingCandidates = platforms
        .filter((platform) => platform.x >= rightX - CHASM_PLATFORM_EDGE_OVERLAP)
        .sort((left, right) => left.x - right.x)[0]
    const landingPlatform = platforms
        .filter((platform) => (
            platform.height >= 120 &&
            platform.x >= rightX - CHASM_PLATFORM_EDGE_OVERLAP
        ))
        .sort((left, right) => left.x - right.x)[0] ?? landingCandidates

    if (!landingPlatform) {
        return points
    }

    return points.map((point) => {
        const insideChasm =
            (
                point.x > leftX + CHASM_PLATFORM_EDGE_OVERLAP &&
                point.x < rightX - CHASM_PLATFORM_EDGE_OVERLAP
            ) ||
            (
                point.x > leftX - 80 &&
                point.x < rightX &&
                !hasNearbySupport(point, platforms)
            )

        if (!insideChasm) {
            return point
        }

        const spacing = type === 'coin' ? 62 : 88
        const baseInset = type === 'coin' ? 100 : landingPlatform.width - 60
        const inset = Math.min(
            landingPlatform.width - 44,
            baseInset + movedCount * spacing,
        )
        const yOffset = type === 'coin' ? 60 : 58
        movedCount += 1

        return {
            ...point,
            x: landingPlatform.x + Math.max(36, inset),
            y: landingPlatform.y - yOffset,
        }
    })
}

function moveCheckpointsOutOfChasm(checkpoints, platforms, leftX, rightX) {
    let movedCount = 0
    const landingPlatform = platforms
        .filter((platform) => (
            platform.height >= 120 &&
            platform.x >= rightX - CHASM_PLATFORM_EDGE_OVERLAP
        ))
        .sort((left, right) => left.x - right.x)[0]

    if (!landingPlatform) {
        return checkpoints
    }

    return checkpoints.map((checkpoint) => {
        const checkpointTop = checkpoint.y + CHECKPOINT_TEXTURE_HEIGHT
        const insideChasm =
            checkpoint.x > leftX + CHASM_PLATFORM_EDGE_OVERLAP &&
            checkpoint.x < rightX - CHASM_PLATFORM_EDGE_OVERLAP &&
            !hasNearbySupport({ x: checkpoint.x, y: checkpointTop - 1 }, platforms)

        if (!insideChasm) {
            return checkpoint
        }

        const x = Math.min(
            landingPlatform.x + landingPlatform.width - CHECKPOINT_PLATFORM_INSET,
            landingPlatform.x + CHECKPOINT_PLATFORM_INSET + movedCount * 120,
        )
        movedCount += 1

        return {
            ...checkpoint,
            x,
            y: landingPlatform.y - CHECKPOINT_TEXTURE_HEIGHT,
        }
    })
}

function getCheckpointPlatformDistance(checkpoint, platform) {
    const platformRight = platform.x + platform.width

    return checkpoint.x < platform.x
        ? platform.x - checkpoint.x
        : Math.max(0, checkpoint.x - platformRight)
}

function snapCheckpointsToPlatforms(checkpoints, platforms) {
    return checkpoints.map((checkpoint) => {
        const nearestPlatform = platforms
            .map((platform) => ({
                platform,
                distance: getCheckpointPlatformDistance(checkpoint, platform),
            }))
            .sort((left, right) => {
                const distanceDiff = left.distance - right.distance
                if (distanceDiff !== 0) {
                    return distanceDiff
                }

                return right.platform.width - left.platform.width
            })[0]

        if (!nearestPlatform || nearestPlatform.distance <= CHECKPOINT_PLATFORM_SNAP_DISTANCE) {
            return checkpoint
        }

        const { platform } = nearestPlatform
        const minX = platform.x + CHECKPOINT_PLATFORM_INSET
        const maxX = platform.x + platform.width - CHECKPOINT_PLATFORM_INSET
        const x = minX <= maxX
            ? Math.min(maxX, Math.max(minX, checkpoint.x))
            : platform.x + platform.width / 2

        return {
            ...checkpoint,
            x,
            y: platform.y - CHECKPOINT_TEXTURE_HEIGHT,
        }
    })
}

function createChasmPlatform(chasm, offsetX, index) {
    const startX = chasm.edgeX + offsetX + CHASM_PLATFORM_EDGE_OVERLAP
    const rightLandingX = chasm.rightX + offsetX + chasm.gapWidth
    const endX = rightLandingX - chasm.platformWidth + CHASM_PLATFORM_EDGE_OVERLAP

    return {
        x: startX,
        y: chasm.y,
        width: chasm.platformWidth,
        height: 28,
        distance: endX - startX,
        speed: chasm.speed,
        requiredChasm: true,
        chasmLeftX: chasm.edgeX + offsetX,
        chasmRightX: rightLandingX,
        label: `Chasm ${index + 1}`,
    }
}

function withMandatoryChasms(level) {
    const chasms = MANDATORY_CHASMS[level.id]

    if (!chasms) {
        return level
    }

    let offsetX = 0
    let nextLevel = {
        ...level,
        movingPlatforms: [],
    }

    chasms.forEach((chasm, index) => {
        const thresholdX = chasm.edgeX + offsetX
        const chasmLeftX = chasm.edgeX + offsetX
        const chasmRightX = chasm.rightX + offsetX + chasm.gapWidth
        const platforms = nextLevel.platforms
            .map((platform) => shiftPlatformAfter(platform, thresholdX, chasm.gapWidth))
            .map((platform) => trimPlatformAroundChasm(platform, chasmLeftX, chasmRightX))
            .filter((platform) => platform && platform.width > 0)
        const coins = nextLevel.coins.map((coin) => (
            shiftPointAfter(coin, thresholdX, chasm.gapWidth)
        ))
        const balls = nextLevel.balls.map((ball) => (
            shiftPointAfter(ball, thresholdX, chasm.gapWidth)
        ))
        const fallingPlatforms = (nextLevel.fallingPlatforms ?? []).map((platform) => (
            shiftPlatformAfter(platform, thresholdX, chasm.gapWidth)
        ))
        const checkpoints = nextLevel.checkpoints.map((checkpoint) => (
            shiftPointAfter(checkpoint, thresholdX, chasm.gapWidth)
        ))

        nextLevel = {
            ...nextLevel,
            worldWidth: nextLevel.worldWidth + chasm.gapWidth,
            goal: shiftPointAfter(nextLevel.goal, thresholdX, chasm.gapWidth),
            platforms,
            fallingPlatforms,
            coins: movePickupsOutOfChasm(coins, platforms, chasmLeftX, chasmRightX, 'coin'),
            balls: movePickupsOutOfChasm(balls, platforms, chasmLeftX, chasmRightX, 'ball'),
            checkpoints: snapCheckpointsToPlatforms(
                moveCheckpointsOutOfChasm(checkpoints, platforms, chasmLeftX, chasmRightX),
                platforms,
            ),
            trees: nextLevel.trees?.map((tree) => (
                shiftPointAfter(tree, thresholdX, chasm.gapWidth)
            )),
            movingPlatforms: [
                ...nextLevel.movingPlatforms,
                createChasmPlatform(chasm, offsetX, index),
            ],
        }

        offsetX += chasm.gapWidth
    })

    return nextLevel
}

function getContentEndX(level) {
    const platformEndX = level.platforms.map((platform) => platform.x + platform.width)
    const movingPlatformEndX = (level.movingPlatforms ?? []).map((platform) => (
        platform.x + platform.width + (platform.distance ?? platform.move?.distance ?? 0)
    ))
    const pointEndX = [
        ...level.coins,
        ...level.balls,
        ...level.checkpoints,
        ...(level.trees ?? []),
    ].map((point) => point.x)

    return Math.max(
        level.goal.x + level.goal.width,
        ...platformEndX,
        ...movingPlatformEndX,
        ...pointEndX,
    )
}

function createMarathonStretch(level) {
    const variant = MARATHON_STRETCH_VARIANTS[(level.id - 1) % MARATHON_STRETCH_VARIANTS.length]
    const baseX = Math.ceil(getContentEndX(level) + MARATHON_STRETCH_START_GAP)
    const groundY = Math.max(...level.platforms
        .filter((platform) => platform.height >= 180)
        .map((platform) => platform.y))

    const platforms = []
    const movingPlatforms = []
    const fallingPlatforms = []
    const coins = []
    const balls = []
    const checkpoints = []
    const trees = []

    Array.from({ length: MARATHON_STRETCH_SEGMENT_COUNT }, (_, index) => {
        const x = baseX + index * MARATHON_STRETCH_SEGMENT_STEP
        const groundTop = Math.min(
            level.worldHeight - 220,
            Math.max(groundY - 190, groundY + variant.groundOffsets[index % variant.groundOffsets.length]),
        )
        const groundWidth = variant.groundWidths[index % variant.groundWidths.length]
        const highY = Math.max(180, groundTop + variant.highOffsets[index % variant.highOffsets.length])
        const highX = x + variant.highXOffsets[index % variant.highXOffsets.length]
        const narrowWidth = variant.narrowWidths[index % variant.narrowWidths.length]

        platforms.push({
            x,
            y: groundTop,
            width: groundWidth,
            height: Math.max(level.worldHeight - groundTop, 220),
        })
        fallingPlatforms.push({
            x: highX,
            y: highY,
            width: narrowWidth,
            height: 28,
        })

        if ((index + level.id) % 3 === 0) {
            coins.push(
                { x: x + Math.round(groundWidth * 0.3), y: groundTop - 60 },
                { x: x + Math.round(groundWidth * 0.65), y: groundTop - 60 },
            )
        } else if ((index + level.id) % 3 === 1) {
            coins.push({ x: highX + Math.round(narrowWidth * 0.45), y: highY - 44 })
        } else {
            coins.push(
                { x: x + Math.round(groundWidth * 0.45), y: groundTop - 58 },
                { x: highX + Math.round(narrowWidth * 0.45), y: highY - 44 },
            )
        }

        if (index % variant.movingEvery === variant.movingRemainder) {
            movingPlatforms.push({
                x: x + variant.movingXOffset,
                y: Math.max(220, groundTop + variant.movingYOffset),
                width: 96 + ((index + level.id) % 3) * 12,
                height: 28,
                distance: variant.movingDistanceBase + index * 3,
                speed: 82 + level.id * 4,
            })
        }

        if (index % variant.ballEvery === variant.ballRemainder) {
            balls.push({ x: highX + Math.round(narrowWidth * 0.5), y: highY - 95 })
        }

        if (index > 0 && index % variant.checkpointEvery === variant.checkpointRemainder) {
            checkpoints.push({
                x: x + Math.min(90, Math.round(groundWidth * 0.35)),
                y: groundTop - CHECKPOINT_TEXTURE_HEIGHT,
                label: `Checkpoint ${Math.floor(index / 4) + 5}`,
            })
        }

        if (level.trees && index % 6 === (level.id + 2) % 6) {
            trees.push({ x: x + Math.round(groundWidth * 0.5), y: groundTop })
        }
    })

    const finalX = baseX + MARATHON_STRETCH_SEGMENT_COUNT * MARATHON_STRETCH_SEGMENT_STEP
    const finalGroundTop = Math.min(
        level.worldHeight - 220,
        Math.max(groundY - 190, groundY + variant.finalGroundOffset),
    )

    variant.entryBridge.forEach((bridge) => {
        fallingPlatforms.push({
            x: baseX + bridge.xOffset,
            y: Math.max(220, groundY + bridge.yOffset),
            width: bridge.width,
            height: 28,
        })
    })

    platforms.push({
        x: finalX - 390,
        y: finalGroundTop,
        width: 320,
        height: Math.max(level.worldHeight - finalGroundTop, 220),
    })

    return {
        platforms,
        movingPlatforms,
        fallingPlatforms,
        coins: [
            ...coins,
            { x: finalX - 250, y: finalGroundTop - 60 },
            { x: finalX - 150, y: finalGroundTop - 60 },
        ],
        balls: [
            ...balls,
            { x: finalX - 120, y: Math.max(180, finalGroundTop - 150) },
        ],
        checkpoints,
        trees,
        worldWidth: finalX + 520,
    }
}

function withMarathonStretch(level) {
    const stretch = createMarathonStretch(level)

    return {
        ...level,
        worldWidth: Math.max(level.worldWidth, stretch.worldWidth),
        platforms: [...level.platforms, ...stretch.platforms],
        movingPlatforms: [
            ...(level.movingPlatforms ?? []),
            ...stretch.movingPlatforms,
        ],
        fallingPlatforms: [
            ...(level.fallingPlatforms ?? []),
            ...stretch.fallingPlatforms,
        ],
        coins: [...level.coins, ...stretch.coins],
        balls: [...level.balls, ...stretch.balls],
        checkpoints: [...level.checkpoints, ...stretch.checkpoints],
        trees: level.trees || stretch.trees.length
            ? [
                ...(level.trees ?? []),
                ...stretch.trees,
            ]
            : level.trees,
    }
}

export const LEVELS = [
    {
        id: 1,
        name: "Art City",
        backgroundKey: "background-art-city",
        worldWidth: 2800,
        worldHeight: 900,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 680, width: 420, height: 220 },
            { x: 1005, y: 600, width: 430, height: 300 },
            { x: 2045, y: 590, width: 220, height: 310 },
            { x: 2375, y: 525, width: 245, height: 375 },
            { x: 300, y: 515, width: 145, height: 28 },
            { x: 750, y: 480, width: 135, height: 28 },
            { x: 1235, y: 440, width: 140, height: 28 },
            { x: 1815, y: 570, width: 130, height: 28 },
            { x: 2155, y: 420, width: 115, height: 28 },
            { x: 610, y: 350, width: 90, height: 24 },
            { x: 1455, y: 350, width: 90, height: 24 },
            { x: 2320, y: 265, width: 90, height: 24 },
        ],
        movingPlatforms: [
            { x: 1435, y: 650, width: 120, height: 28, distance: 150, speed: 66 },
        ],
        coins: [
            { x: 390, y: 610 },
            { x: 250, y: 610 },
            { x: 320, y: 610 },
            { x: 370, y: 480 },
            { x: 820, y: 450 },
            { x: 1100, y: 560 },
            { x: 1280, y: 410 },
            { x: 1370, y: 410 },
            { x: 1540, y: 620 },
            { x: 1835, y: 525 },
            { x: 1890, y: 490 },
            { x: 2200, y: 370 },
            { x: 2470, y: 485 },
            { x: 2550, y: 485 },
        ],
        balls: [
            { x: 655, y: 295 },
            { x: 1500, y: 295 },
            { x: 2365, y: 210 },
        ],
        checkpoints: [
            { x: 1090, y: 560, label: "Checkpoint 1" },
            { x: 2100, y: 560, label: "Checkpoint 2" },
        ],
        goal: { x: 2650, y: 470, width: 56, height: 90 },
        boss: {
            name: "Elfa",
            playerHp: 4,
            hp: 24,
            speed: 112,
            attackCooldown: 1350,
            projectileSpeed: 285,
            paintPuddleSpawnChance: 0.3,
            specialAttackReductionPerBall: 0,
            dodgeChance: 0.28,
            critChance: 0.16,
            shotOffsetY: -76,
            shotScale: 0.24,
        },
    },
    {
        id: 2,
        name: "Bridge Hills",
        backgroundKey: "background-candy-town",
        worldWidth: 3400,
        worldHeight: 920,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 680, width: 360, height: 240 },
            { x: 470, y: 610, width: 230, height: 310 },
            { x: 1180, y: 590, width: 290, height: 330 },
            { x: 1600, y: 470, width: 210, height: 450 },
            { x: 1935, y: 675, width: 220, height: 245 },
            { x: 2265, y: 540, width: 230, height: 380 },
            { x: 3000, y: 580, width: 300, height: 340 },
            { x: 260, y: 500, width: 95, height: 24 },
            { x: 640, y: 440, width: 95, height: 24 },
            { x: 960, y: 520, width: 95, height: 24 },
            { x: 1295, y: 405, width: 105, height: 24 },
            { x: 1740, y: 365, width: 110, height: 24 },
            { x: 2380, y: 455, width: 105, height: 24 },
            { x: 2760, y: 615, width: 95, height: 24 },
            { x: 150, y: 365, width: 85, height: 24 },
            { x: 1465, y: 275, width: 85, height: 24 },
            { x: 2520, y: 380, width: 85, height: 24 },
        ],
        movingPlatforms: [
            { x: 1470, y: 540, width: 115, height: 28, distance: 130, speed: 76 },
        ],
        coins: [
            { x: 260, y: 610 },
            { x: 330, y: 610 },
            { x: 290, y: 465 },
            { x: 520, y: 560 },
            { x: 680, y: 410 },
            { x: 920, y: 485 },
            { x: 990, y: 485 },
            { x: 1320, y: 380 },
            { x: 1420, y: 560 },
            { x: 1610, y: 440 },
            { x: 1760, y: 340 },
            { x: 2020, y: 530 },
            { x: 2140, y: 500 },
            { x: 2360, y: 430 },
            { x: 2730, y: 580 },
            { x: 3090, y: 540 },
            { x: 3180, y: 540 },
        ],
        balls: [
            { x: 192, y: 315 },
            { x: 1508, y: 220 },
            { x: 2562, y: 325 },
        ],
        checkpoints: [
            { x: 1160, y: 560, label: "Checkpoint 1" },
            { x: 2230, y: 500, label: "Checkpoint 2" },
        ],
        goal: { x: 3270, y: 510, width: 56, height: 90 },
        boss: {
            name: "Annamaria",
            playerHp: 4,
            hp: 28,
            speed: 124,
            attackCooldown: 1275,
            projectileSpeed: 305,
            dodgeChance: 0.34,
            critChance: 0.18,
            cakeRainAttackChance: 0.4,
            cakeRainCooldown: 1500,
            cakeRainProjectileCount: 8,
            cakeRainFallSpeed: 420,
            cakeRainShotScale: 0.48,
            cakeRainShotBodyWidth: 42,
            cakeRainShotBodyHeight: 32,
            scaleMultiplier: 1.2,
            shotOffsetX: 68,
            shotOffsetY: -88,
            shotScale: 0.55,
            shotBodyWidth: 42,
            shotBodyHeight: 28,
            scaleAnimationsToMove: ['attack', 'hit'],
            defeatedScaleUsesFullFrame: true,
            defeatedScaleMultiplier: 2.75,
            defeatedFootSink: 24,
        },
    },
    {
        id: 3,
        name: "Sky Route",
        backgroundKey: "background-card-city",
        worldWidth: 4100,
        worldHeight: 960,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 680, width: 300, height: 280 },
            { x: 410, y: 590, width: 200, height: 370 },
            { x: 1390, y: 585, width: 200, height: 375 },
            { x: 1705, y: 505, width: 205, height: 455 },
            { x: 2045, y: 435, width: 190, height: 525 },
            { x: 2370, y: 670, width: 205, height: 290 },
            { x: 2695, y: 545, width: 195, height: 415 },
            { x: 3025, y: 475, width: 190, height: 485 },
            { x: 3355, y: 395, width: 190, height: 565 },
            { x: 3685, y: 620, width: 190, height: 340 },
            { x: 3975, y: 500, width: 185, height: 460 },
            { x: 580, y: 415, width: 92, height: 24 },
            { x: 895, y: 330, width: 84, height: 24 },
            { x: 1045, y: 585, width: 220, height: 24 },
            { x: 1520, y: 415, width: 92, height: 24 },
            { x: 1850, y: 345, width: 92, height: 24 },
            { x: 2175, y: 250, width: 92, height: 24 },
            { x: 2500, y: 565, width: 84, height: 24 },
            { x: 2820, y: 470, width: 92, height: 24 },
            { x: 3145, y: 390, width: 84, height: 24 },
            { x: 725, y: 340, width: 78, height: 24 },
            { x: 1975, y: 215, width: 78, height: 24 },
            { x: 2700, y: 375, width: 78, height: 24 },
            { x: 3715, y: 400, width: 78, height: 24 },
        ],
        movingPlatforms: [
            { x: 1265, y: 660, width: 105, height: 28, distance: 125, speed: 84 },
            { x: 3215, y: 535, width: 98, height: 28, distance: 140, speed: 92 },
        ],
        coins: [
            { x: 240, y: 610 },
            { x: 290, y: 610 },
            { x: 310, y: 460 },
            { x: 610, y: 380 },
            { x: 910, y: 300 },
            { x: 1080, y: 470 },
            { x: 1210, y: 550 },
            { x: 1520, y: 380 },
            { x: 1690, y: 470 },
            { x: 1860, y: 290 },
            { x: 2170, y: 220 },
            { x: 2330, y: 590 },
            { x: 2480, y: 530 },
            { x: 2800, y: 440 },
            { x: 2590, y: 530 },
            { x: 3120, y: 360 },
            { x: 3300, y: 280 },
            { x: 3460, y: 280 },
            { x: 3620, y: 540 },
            { x: 3920, y: 460 },
        ],
        balls: [
            { x: 764, y: 285 },
            { x: 2014, y: 160 },
            { x: 2739, y: 330 },
            { x: 3754, y: 345 },
        ],
        checkpoints: [
            { x: 1390, y: 550, label: "Checkpoint 1" },
            { x: 2950, y: 440, label: "Checkpoint 2" },
        ],
        trees: [
            { x: 1490, y: 585 },
            { x: 2475, y: 670 },
            { x: 3780, y: 620 },
        ],
        goal: { x: 4000, y: 430, width: 56, height: 90 },
        boss: {
            name: "Der Schröder",
            playerHp: 5,
            hp: 32,
            speed: 136,
            attackCooldown: 1175,
            projectileSpeed: 325,
            dodgeChance: 0.4,
            critChance: 0.2,
            cardSpreadAttackChance: 0.58,
            cakeRainAttackChance: 0.34,
            cakeRainCooldown: 1500,
            cakeRainProjectileCount: 8,
            cakeRainFallSpeed: 430,
            cakeRainShotScale: 0.54,
            cakeRainShotBodyWidth: 42,
            cakeRainShotBodyHeight: 28,
            cakeRainToast: "Kartenregen!",
            specialAttackReductionPerBall: 0.01,
            scaleMultiplier: 1.2,
            shotOffsetX: 68,
            shotOffsetY: -90,
            shotScale: 0.62,
            shotBodyWidth: 42,
            shotBodyHeight: 24,
            defeatedScaleMultiplier: 1.05,
            defeatedScaleMatchesStand: true,
            defeatedStandScaleMultiplier: 0.64,
            defeatedFootSink: 30,
        },
    },
    {
        id: 4,
        name: "Shisha City",
        backgroundKey: "background-shisha-city",
        worldWidth: 4400,
        worldHeight: 980,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 680, width: 320, height: 300 },
            { x: 455, y: 600, width: 215, height: 380 },
            { x: 820, y: 535, width: 195, height: 445 },
            { x: 1545, y: 590, width: 220, height: 390 },
            { x: 1915, y: 505, width: 215, height: 475 },
            { x: 2295, y: 680, width: 250, height: 300 },
            { x: 2695, y: 570, width: 215, height: 410 },
            { x: 3045, y: 485, width: 215, height: 495 },
            { x: 3405, y: 665, width: 240, height: 315 },
            { x: 3795, y: 535, width: 215, height: 445 },
            { x: 4145, y: 670, width: 220, height: 310 },
            { x: 1015, y: 475, width: 100, height: 28 },
            { x: 1410, y: 400, width: 105, height: 28 },
            { x: 1780, y: 340, width: 100, height: 28 },
            { x: 2150, y: 445, width: 100, height: 28 },
            { x: 2545, y: 490, width: 100, height: 28 },
            { x: 2925, y: 400, width: 100, height: 28 },
            { x: 3290, y: 360, width: 92, height: 28 },
            { x: 3675, y: 500, width: 100, height: 28 },
            { x: 4005, y: 470, width: 92, height: 28 },
            { x: 815, y: 350, width: 82, height: 28 },
            { x: 1645, y: 270, width: 82, height: 28 },
            { x: 2410, y: 330, width: 82, height: 28 },
            { x: 3120, y: 210, width: 82, height: 28 },
            { x: 3850, y: 350, width: 82, height: 28 },
        ],
        movingPlatforms: [
            { x: 670, y: 590, width: 110, height: 28, distance: 150, speed: 86 },
            { x: 2545, y: 625, width: 104, height: 28, distance: 150, speed: 94 },
        ],
        coins: [
            { x: 240, y: 610 },
            { x: 300, y: 610 },
            { x: 555, y: 540 },
            { x: 980, y: 500 },
            { x: 1085, y: 440 },
            { x: 840, y: 500 },
            { x: 1030, y: 440 },
            { x: 1485, y: 370 },
            { x: 1430, y: 370 },
            { x: 1790, y: 310 },
            { x: 1940, y: 470 },
            { x: 2150, y: 410 },
            { x: 2490, y: 455 },
            { x: 2800, y: 530 },
            { x: 2910, y: 370 },
            { x: 1580, y: 550 },
            { x: 3270, y: 330 },
            { x: 3080, y: 360 },
            { x: 3500, y: 580 },
            { x: 3650, y: 440 },
            { x: 3760, y: 500 },
            { x: 3960, y: 390 },
            { x: 4160, y: 590 },
        ],
        balls: [
            { x: 856, y: 295 },
            { x: 1686, y: 215 },
            { x: 2451, y: 275 },
            { x: 3161, y: 155 },
            { x: 3891, y: 295 },
        ],
        checkpoints: [
            { x: 1540, y: 550, label: "Checkpoint 1" },
            { x: 3000, y: 450, label: "Checkpoint 2" },
        ],
        goal: { x: 4250, y: 560, width: 56, height: 90 },
        boss: {
            name: "Horstinator",
            playerHp: 5,
            hp: 36,
            speed: 140,
            attackCooldown: 1100,
            projectileSpeed: 325,
            dodgeChance: 0.43,
            critChance: 0.21,
            scaleMultiplier: 1.38,
            shotOffsetX: 68,
            shotOffsetY: -82,
            shotScale: 0.58,
            shotBodyWidth: 42,
            shotBodyHeight: 24,
            specialProjectileFrame: 8,
            specialProjectileRange: 360,
            specialProjectileSpeed: 240,
            specialShotOffsetX: 92,
            specialShotOffsetY: -80,
            specialShotScale: 0.14,
            specialShotBodyWidth: 78,
            specialShotBodyHeight: 118,
            specialShotBodyOffsetY: 14,
            specialAttackChance: 0.5,
            specialAttackReductionPerBall: 0.01,
            specialAttackDamage: 2,
            defeatedScaleMultiplier: 0.72,
            defeatedFootSink: 20,
        },
    },
    {
        id: 5,
        name: "Horse Power",
        backgroundKey: "background-horses",
        worldWidth: 4700,
        worldHeight: 1040,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 700, width: 280, height: 340 },
            { x: 390, y: 610, width: 185, height: 430 },
            { x: 720, y: 515, width: 180, height: 525 },
            { x: 1035, y: 420, width: 170, height: 620 },
            { x: 1345, y: 645, width: 225, height: 395 },
            { x: 1725, y: 495, width: 185, height: 545 },
            { x: 2065, y: 400, width: 180, height: 640 },
            { x: 2390, y: 635, width: 215, height: 405 },
            { x: 2760, y: 515, width: 185, height: 525 },
            { x: 3095, y: 430, width: 180, height: 610 },
            { x: 3435, y: 675, width: 230, height: 365 },
            { x: 3825, y: 535, width: 195, height: 505 },
            { x: 4180, y: 455, width: 185, height: 585 },
            { x: 4515, y: 640, width: 220, height: 400 },
            { x: 260, y: 530, width: 78, height: 28 },
            { x: 595, y: 450, width: 84, height: 28 },
            { x: 910, y: 360, width: 84, height: 28 },
            { x: 1235, y: 310, width: 84, height: 28 },
            { x: 1575, y: 535, width: 84, height: 28 },
            { x: 1900, y: 420, width: 92, height: 28 },
            { x: 2240, y: 330, width: 84, height: 28 },
            { x: 2575, y: 515, width: 84, height: 28 },
            { x: 2915, y: 400, width: 92, height: 28 },
            { x: 3250, y: 320, width: 84, height: 28 },
            { x: 4330, y: 380, width: 84, height: 28 },
            { x: 1050, y: 275, width: 76, height: 28 },
            { x: 1735, y: 360, width: 80, height: 28 },
            { x: 3110, y: 185, width: 80, height: 28 },
            { x: 4160, y: 255, width: 80, height: 28 },
        ],
        movingPlatforms: [
            { x: 575, y: 585, width: 100, height: 28, distance: 145, speed: 92 },
            { x: 2245, y: 590, width: 96, height: 28, distance: 145, speed: 104 },
        ],
        coins: [
            { x: 260, y: 640 },
            { x: 410, y: 570 },
            { x: 300, y: 500 },
            { x: 620, y: 420 },
            { x: 920, y: 330 },
            { x: 1230, y: 280 },
            { x: 1370, y: 560 },
            { x: 1580, y: 500 },
            { x: 1870, y: 390 },
            { x: 2210, y: 300 },
            { x: 2050, y: 300 },
            { x: 2380, y: 550 },
            { x: 2530, y: 480 },
            { x: 2760, y: 480 },
            { x: 2870, y: 370 },
            { x: 3190, y: 290 },
            { x: 1100, y: 340 },
            { x: 3030, y: 400 },
            { x: 3400, y: 590 },
            { x: 3580, y: 530 },
            { x: 3920, y: 450 },
            { x: 480, y: 560 },
            { x: 4240, y: 350 },
            { x: 4450, y: 560 },
        ],
        balls: [
            { x: 1088, y: 220 },
            { x: 1775, y: 305 },
            { x: 3150, y: 130 },
            { x: 4200, y: 200 },
        ],
        checkpoints: [
            { x: 1700, y: 460, label: "Checkpoint 1" },
            { x: 3320, y: 590, label: "Checkpoint 2" },
        ],
        goal: { x: 4560, y: 530, width: 56, height: 90 },
        boss: {
            name: "Foxy",
            playerHp: 5,
            hp: 40,
            scaleMultiplier: 1.2,
            speed: 212,
            attackCooldown: 1025,
            projectileSpeed: 340,
            dodgeChance: 0.5,
            critChance: 0.22,
            chargeAttackChance: 0.36,
            specialAttackReductionPerBall: 0.01,
            shotScale: 0.5,
            shotBodyWidth: 42,
            shotBodyHeight: 24,
            defeatedScaleMultiplier: 0.85,
            defeatedFootSink: 25,
        },
    },
    {
        id: 6,
        name: "Cyber City",
        backgroundKey: "background-champion-ridge",
        worldWidth: 5200,
        worldHeight: 1060,
        spawn: { x: 120, y: 650 },
        platforms: [
            { x: 0, y: 700, width: 300, height: 360 },
            { x: 410, y: 600, width: 185, height: 460 },
            { x: 745, y: 515, width: 180, height: 545 },
            { x: 1435, y: 545, width: 185, height: 515 },
            { x: 1775, y: 505, width: 180, height: 555 },
            { x: 2110, y: 650, width: 200, height: 410 },
            { x: 2460, y: 500, width: 185, height: 560 },
            { x: 2795, y: 410, width: 180, height: 650 },
            { x: 3130, y: 665, width: 220, height: 395 },
            { x: 3505, y: 535, width: 185, height: 525 },
            { x: 3845, y: 440, width: 180, height: 620 },
            { x: 4180, y: 635, width: 210, height: 425 },
            { x: 4545, y: 495, width: 185, height: 565 },
            { x: 4885, y: 400, width: 180, height: 660 },
            { x: 5205, y: 635, width: 190, height: 425 },
            { x: 1015, y: 350, width: 76, height: 28 },
            { x: 1280, y: 445, width: 76, height: 28 },
            { x: 1605, y: 380, width: 76, height: 28 },
            { x: 1935, y: 310, width: 84, height: 28 },
            { x: 2275, y: 500, width: 76, height: 28 },
            { x: 2610, y: 330, width: 84, height: 28 },
            { x: 2935, y: 260, width: 76, height: 28 },
            { x: 3295, y: 540, width: 84, height: 28 },
            { x: 3625, y: 370, width: 76, height: 28 },
            { x: 3960, y: 290, width: 84, height: 28 },
            { x: 4315, y: 515, width: 76, height: 28 },
            { x: 4645, y: 350, width: 84, height: 28 },
            { x: 4975, y: 270, width: 76, height: 28 },
            { x: 800, y: 295, width: 76, height: 28 },
            { x: 1485, y: 325, width: 76, height: 28 },
            { x: 2740, y: 255, width: 76, height: 28 },
            { x: 3820, y: 245, width: 76, height: 28 },
            { x: 4895, y: 210, width: 76, height: 28 },
        ],
        movingPlatforms: [
            { x: 595, y: 570, width: 96, height: 28, distance: 150, speed: 96 },
            { x: 2975, y: 610, width: 96, height: 28, distance: 155, speed: 112 },
        ],
        coins: [
            { x: 240, y: 640 },
            { x: 290, y: 640 },
            { x: 310, y: 475 },
            { x: 640, y: 400 },
            { x: 950, y: 320 },
            { x: 940, y: 470 },
            { x: 1280, y: 410 },
            { x: 1580, y: 350 },
            { x: 1910, y: 280 },
            { x: 2070, y: 560 },
            { x: 2240, y: 470 },
            { x: 520, y: 560 },
            { x: 1400, y: 410 },
            { x: 2160, y: 390 },
            { x: 2560, y: 300 },
            { x: 2880, y: 230 },
            { x: 3060, y: 580 },
            { x: 3360, y: 390 },
            { x: 3240, y: 510 },
            { x: 3560, y: 340 },
            { x: 3890, y: 260 },
            { x: 4070, y: 550 },
            { x: 4380, y: 365 },
            { x: 4240, y: 480 },
            { x: 4560, y: 320 },
            { x: 4710, y: 300 },
            { x: 4880, y: 240 },
            { x: 5220, y: 575 },
        ],
        balls: [
            { x: 838, y: 240 },
            { x: 1523, y: 270 },
            { x: 2778, y: 200 },
            { x: 3858, y: 190 },
            { x: 4933, y: 155 },
        ],
        checkpoints: [
            { x: 1680, y: 470, label: "Checkpoint 1" },
            { x: 3330, y: 500, label: "Checkpoint 2" },
            { x: 4650, y: 370, label: "Checkpoint 3" },
        ],
        goal: { x: 5080, y: 530, width: 56, height: 90 },
        boss: {
            name: "Zukunftstechnologe",
            playerHp: 6,
            hp: 36,
            speed: 145,
            attackCooldown: 1000,
            projectileSpeed: 345,
            dodgeChance: 0.52,
            critChance: 0.23,
            cakeRainAttackChance: 0.36,
            cakeRainCooldown: 1500,
            cakeRainProjectileCount: 8,
            cakeRainFallSpeed: 440,
            cakeRainShotScale: 0.5,
            cakeRainShotBodyWidth: 42,
            cakeRainShotBodyHeight: 28,
            scaleMultiplier: 1.1,
            shotOffsetY: -89,
            shotScale: 0.5,
            shotBodyWidth: 42,
            shotBodyHeight: 25,
            defeatedScaleMultiplier: 0.90,
            defeatedFootSink: 28,
            phase2: {
                name: "Arro",
                playerHp: 6,
                hp: 32,
                scaleMultiplier: 1.35,
                speed: 148,
                attackCooldown: 925,
                projectileSpeed: 350,
                dodgeChance: 0.58,
                critChance: 0.24,
                shotOffsetY: -109,
                shotScale: 0.5,
                shotBodyWidth: 42,
                shotBodyHeight: 25,
                projectileFrame: 7,
                specialAttackDamage: 3,
                specialAttackChance: 0.42,
                specialAttackReductionPerBall: 0.01,
                specialProjectileSpeed: 300,
                specialProjectileRange: 480,
                specialShotScale: 0.13,
                specialShotBodyFullWidth: true,
                specialShotBodyHeight: 75,
                specialShotBodyOffsetY: 32,
                specialShotBodyExtendsToFloor: true,
                specialShotOffsetX: 150,
            },
        },
    },
].map(withPreBossExtension).map(withMandatoryChasms).map(withMarathonStretch).map(withBossDefaults)
