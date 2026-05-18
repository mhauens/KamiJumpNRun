import { LEVELS } from '../src/data/levels.js';

const PICKUP_RULES = {
  coin: { radius: 16 },
  ball: { radius: 22 },
};

const MIN_PICKUP_CENTER_DISTANCE = 36;
const GROUND_MIN_HEIGHT = 120;
const GROUND_SURFACE_CLEARANCE = 12;
const MAX_GROUND_PICKUP_HEIGHT = 180;
const MAX_FLOATING_PICKUP_HEIGHT = 160;
const MAX_PLATFORM_SIDE_REACH = 160;
const CHECKPOINT_PLATFORM_SNAP_DISTANCE = 96;
const MIN_REQUIRED_CHASM_WIDTH = 420;

const failures = [];
const warnings = [];

function formatPoint(point) {
  return `(${point.x}, ${point.y})`;
}

function addFailure(level, message) {
  failures.push(`Level ${level.id}: ${message}`);
}

function addWarning(level, message) {
  warnings.push(`Level ${level.id}: ${message}`);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function distance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function isGroundBlock(platform) {
  return platform.height >= GROUND_MIN_HEIGHT;
}

function getSupportingPlatforms(level, pickup) {
  return level.platforms.filter((platform) => (
    pickup.x >= platform.x - MAX_PLATFORM_SIDE_REACH &&
    pickup.x <= platform.x + platform.width + MAX_PLATFORM_SIDE_REACH &&
    pickup.y < platform.y &&
    pickup.y >= platform.y - (
      isGroundBlock(platform) ? MAX_GROUND_PICKUP_HEIGHT : MAX_FLOATING_PICKUP_HEIGHT
    )
  ));
}

function getContainingGroundBlocks(level, pickup) {
  return level.platforms.filter((platform) => (
    isGroundBlock(platform) &&
    pickup.x >= platform.x &&
    pickup.x <= platform.x + platform.width
  ));
}

function getCheckpointPlatforms(level, checkpoint) {
  return level.platforms.filter((platform) => {
    const platformRight = platform.x + platform.width;
    const distance = checkpoint.x < platform.x
      ? platform.x - checkpoint.x
      : Math.max(0, checkpoint.x - platformRight);

    return distance <= CHECKPOINT_PLATFORM_SNAP_DISTANCE;
  });
}

function validateBounds(level, objectName, point) {
  if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
    addFailure(level, `${objectName} has invalid coordinates ${formatPoint(point)}`);
    return;
  }

  if (point.x < 0 || point.x > level.worldWidth || point.y < 0 || point.y > level.worldHeight) {
    addFailure(level, `${objectName} is outside world bounds at ${formatPoint(point)}`);
  }
}

function validatePickups(level) {
  const pickups = [
    ...level.coins.map((point, index) => ({ ...point, type: 'coin', index })),
    ...level.balls.map((point, index) => ({ ...point, type: 'ball', index })),
  ];

  pickups.forEach((pickup) => {
    validateBounds(level, `${pickup.type} ${pickup.index + 1}`, pickup);

    const support = getSupportingPlatforms(level, pickup);
    if (support.length === 0) {
      addFailure(level, `${pickup.type} ${pickup.index + 1} has no reachable nearby platform at ${formatPoint(pickup)}`);
    }

    const pickupBottom = pickup.y + PICKUP_RULES[pickup.type].radius;
    getContainingGroundBlocks(level, pickup).forEach((platform) => {
      if (pickupBottom > platform.y - GROUND_SURFACE_CLEARANCE) {
        addFailure(
          level,
          `${pickup.type} ${pickup.index + 1} sits inside ground at ${formatPoint(pickup)}; platform top is y=${platform.y}`,
        );
      }
    });
  });

  for (let leftIndex = 0; leftIndex < pickups.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < pickups.length; rightIndex += 1) {
      const left = pickups[leftIndex];
      const right = pickups[rightIndex];
      const centerDistance = distance(left, right);
      const overlapDistance = PICKUP_RULES[left.type].radius + PICKUP_RULES[right.type].radius;

      if (centerDistance < overlapDistance) {
        addFailure(
          level,
          `${left.type} ${left.index + 1} overlaps ${right.type} ${right.index + 1}: ${formatPoint(left)} vs ${formatPoint(right)}`,
        );
      } else if (centerDistance < MIN_PICKUP_CENTER_DISTANCE) {
        addWarning(
          level,
          `${left.type} ${left.index + 1} is very close to ${right.type} ${right.index + 1}: ${Math.round(centerDistance)}px apart`,
        );
      }
    }
  }
}

function validateCheckpoints(level) {
  (level.checkpoints ?? []).forEach((checkpoint, index) => {
    validateBounds(level, `checkpoint ${index + 1}`, checkpoint);

    if (getCheckpointPlatforms(level, checkpoint).length === 0) {
      addFailure(level, `checkpoint ${index + 1} has no reachable nearby platform at ${formatPoint(checkpoint)}`);
    }
  });
}

function validateLevel(level, seenIds) {
  if (seenIds.has(level.id)) {
    addFailure(level, `duplicate level id ${level.id}`);
  }
  seenIds.add(level.id);

  ['worldWidth', 'worldHeight'].forEach((key) => {
    if (!isFiniteNumber(level[key]) || level[key] <= 0) {
      addFailure(level, `${key} must be a positive number`);
    }
  });

  validateBounds(level, 'spawn', level.spawn);
  validateBounds(level, 'goal', level.goal);

  if (!Array.isArray(level.platforms) || level.platforms.length === 0) {
    addFailure(level, 'has no platforms');
  }

  level.platforms.forEach((platform, index) => {
    ['x', 'y', 'width', 'height'].forEach((key) => {
      if (!isFiniteNumber(platform[key])) {
        addFailure(level, `platform ${index + 1} has invalid ${key}`);
      }
    });

    if (platform.width <= 0 || platform.height <= 0) {
      addFailure(level, `platform ${index + 1} must have positive size`);
    }
  });

  (level.movingPlatforms ?? []).forEach((platform, index) => {
    ['x', 'y', 'width', 'height'].forEach((key) => {
      if (!isFiniteNumber(platform[key])) {
        addFailure(level, `moving platform ${index + 1} has invalid ${key}`);
      }
    });

    if (platform.width <= 0 || platform.height <= 0) {
      addFailure(level, `moving platform ${index + 1} must have positive size`);
    }

    const distance = platform.distance ?? platform.move?.distance;
    const speed = platform.speed ?? platform.move?.speed;

    if (!isFiniteNumber(distance) || distance <= 0) {
      addFailure(level, `moving platform ${index + 1} must have a positive distance`);
    }

    if (!isFiniteNumber(speed) || speed <= 0) {
      addFailure(level, `moving platform ${index + 1} must have a positive speed`);
    }

    const minX = Math.min(platform.x, platform.x + distance);
    const maxX = Math.max(platform.x, platform.x + distance) + platform.width;

    if (minX < 0 || maxX > level.worldWidth || platform.y < 0 || platform.y + platform.height > level.worldHeight) {
      addFailure(level, `moving platform ${index + 1} path is outside world bounds`);
    }

    if (platform.requiredChasm) {
      if (!isFiniteNumber(platform.chasmLeftX) || !isFiniteNumber(platform.chasmRightX)) {
        addFailure(level, `moving platform ${index + 1} required chasm is missing bounds`);
        return;
      }

      const chasmWidth = platform.chasmRightX - platform.chasmLeftX;
      if (chasmWidth < MIN_REQUIRED_CHASM_WIDTH) {
        addFailure(level, `moving platform ${index + 1} required chasm is too short (${chasmWidth}px)`);
      }

      const blockedByStaticPlatform = level.platforms.some((staticPlatform) => (
        staticPlatform.x < platform.chasmRightX &&
        staticPlatform.x + staticPlatform.width > platform.chasmLeftX
      ));

      if (blockedByStaticPlatform) {
        addFailure(level, `moving platform ${index + 1} required chasm is bridged by a static platform`);
      }
    }
  });

  validatePickups(level);
  validateCheckpoints(level);
}

const seenIds = new Set();
LEVELS.forEach((level) => validateLevel(level, seenIds));

warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

if (failures.length > 0) {
  console.error(`Level validation failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Level validation passed for ${LEVELS.length} level(s).`);
