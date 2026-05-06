const AXIS_DEADZONE = 0.35;
const BUTTON_THRESHOLD = 0.5;

const STANDARD_BUTTONS = {
  action: [0, 1],
  restart: [8, 9],
  alternateAction: [2, 3],
  dpadUp: [12],
  dpadDown: [13],
  dpadLeft: [14],
  dpadRight: [15],
};

const NAMED_BUTTONS = {
  action: ['A', 'B'],
  restart: ['BACK', 'START', 'back', 'start'],
  alternateAction: ['X', 'Y'],
  dpadUp: ['up'],
  dpadDown: ['down'],
  dpadLeft: ['left'],
  dpadRight: ['right'],
};

export function refreshGamepads(scene) {
  scene.input.gamepad?.refreshPads?.();
}

export function getPrimaryGamepad(scene) {
  const gamepadPlugin = scene.input.gamepad;

  if (!gamepadPlugin) {
    return null;
  }

  refreshGamepads(scene);

  return gamepadPlugin.pad1 ||
    gamepadPlugin.pad2 ||
    gamepadPlugin.pad3 ||
    gamepadPlugin.pad4 ||
    null;
}

export function readGamepadInput(scene, previousButtons = {}) {
  const pad = getPrimaryGamepad(scene);

  if (!pad) {
    return {
      connected: false,
      left: false,
      right: false,
      up: false,
      down: false,
      actionJustPressed: false,
      restartJustPressed: false,
      alternateActionJustPressed: false,
      menuUpJustPressed: false,
      menuDownJustPressed: false,
      buttons: {},
    };
  }

  const buttons = {
    action: isButtonGroupDown(pad, 'action'),
    restart: isButtonGroupDown(pad, 'restart'),
    alternateAction: isButtonGroupDown(pad, 'alternateAction'),
    menuUp: isButtonGroupDown(pad, 'dpadUp'),
    menuDown: isButtonGroupDown(pad, 'dpadDown'),
  };
  const axisX = getAxisValue(pad, 0);
  const axisY = getAxisValue(pad, 1);
  const stickX = pad.leftStick?.x ?? axisX;
  const stickY = pad.leftStick?.y ?? axisY;
  const dpadLeft = isButtonGroupDown(pad, 'dpadLeft');
  const dpadRight = isButtonGroupDown(pad, 'dpadRight');
  const up = stickY < -AXIS_DEADZONE || buttons.menuUp;
  const down = stickY > AXIS_DEADZONE || buttons.menuDown;

  buttons.menuUp = up;
  buttons.menuDown = down;

  return {
    connected: true,
    left: stickX < -AXIS_DEADZONE || dpadLeft,
    right: stickX > AXIS_DEADZONE || dpadRight,
    up,
    down,
    actionJustPressed: buttons.action && !previousButtons.action,
    restartJustPressed: buttons.restart && !previousButtons.restart,
    alternateActionJustPressed: buttons.alternateAction && !previousButtons.alternateAction,
    menuUpJustPressed: buttons.menuUp && !previousButtons.menuUp,
    menuDownJustPressed: buttons.menuDown && !previousButtons.menuDown,
    buttons,
  };
}

function isButtonGroupDown(pad, groupName) {
  return NAMED_BUTTONS[groupName].some((buttonName) => isNamedButtonDown(pad, buttonName)) ||
    STANDARD_BUTTONS[groupName].some((buttonIndex) => getButtonValue(pad, buttonIndex) > BUTTON_THRESHOLD);
}

function isNamedButtonDown(pad, buttonName) {
  const button = pad[buttonName];

  return Boolean(button?.pressed || button?.value > BUTTON_THRESHOLD);
}

function getButtonValue(pad, buttonIndex) {
  if (typeof pad.getButtonValue === 'function') {
    return pad.getButtonValue(buttonIndex);
  }

  const button = pad.buttons?.[buttonIndex];

  if (!button) {
    return 0;
  }

  return button.value ?? Number(button.pressed);
}

function getAxisValue(pad, axisIndex) {
  if (typeof pad.getAxisValue === 'function') {
    return pad.getAxisValue(axisIndex);
  }

  return pad.axes?.[axisIndex]?.getValue?.() ?? pad.axes?.[axisIndex]?.value ?? 0;
}
