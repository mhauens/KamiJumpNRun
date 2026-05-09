export const RUNTIME_SPRITE_ATLAS_PREFIX = 'runtime-sprite-atlas';

const MAX_ATLAS_SIZE = 4096;
const FRAME_PADDING = 2;
const atlasFrameKeys = new Map();
let atlasPageCount = 0;

function getImageForTexture(scene, textureKey) {
  if (!scene.textures.exists(textureKey)) {
    return null;
  }

  const image = scene.textures.get(textureKey).getSourceImage();

  if (!image?.width || !image?.height) {
    return null;
  }

  return image;
}

function createPage() {
  return {
    entries: [],
    x: FRAME_PADDING,
    y: FRAME_PADDING,
    rowHeight: 0,
    width: 0,
    height: 0,
  };
}

function placeEntry(page, entry) {
  const paddedWidth = entry.width + FRAME_PADDING * 2;
  const paddedHeight = entry.height + FRAME_PADDING * 2;

  if (page.x + paddedWidth > MAX_ATLAS_SIZE) {
    page.x = FRAME_PADDING;
    page.y += page.rowHeight + FRAME_PADDING;
    page.rowHeight = 0;
  }

  if (page.y + paddedHeight > MAX_ATLAS_SIZE) {
    return false;
  }

  entry.x = page.x;
  entry.y = page.y;
  page.entries.push(entry);
  page.x += paddedWidth;
  page.rowHeight = Math.max(page.rowHeight, paddedHeight);
  page.width = Math.max(page.width, entry.x + entry.width + FRAME_PADDING);
  page.height = Math.max(page.height, entry.y + entry.height + FRAME_PADDING);

  return true;
}

export function createRuntimeSpriteAtlas(scene, textureKeys, { reset = true } = {}) {
  if (reset) {
    atlasFrameKeys.clear();
    for (let index = 1; index <= atlasPageCount; index += 1) {
      const atlasKey = `${RUNTIME_SPRITE_ATLAS_PREFIX}-${index}`;

      if (scene.textures.exists(atlasKey)) {
        scene.textures.remove(atlasKey);
      }
    }
    atlasPageCount = 0;
  }

  const entries = textureKeys
    .filter((textureKey) => !atlasFrameKeys.has(textureKey))
    .map((textureKey) => {
      const image = getImageForTexture(scene, textureKey);

      return image
        ? {
            key: textureKey,
            image,
            width: image.width,
            height: image.height,
          }
        : null;
    })
    .filter(Boolean)
    .filter((entry) => (
      entry.width + FRAME_PADDING * 2 <= MAX_ATLAS_SIZE &&
      entry.height + FRAME_PADDING * 2 <= MAX_ATLAS_SIZE
    ))
    .sort((left, right) => right.height - left.height);

  const pages = [];

  entries.forEach((entry) => {
    let page = pages[pages.length - 1];

    if (!page || !placeEntry(page, entry)) {
      page = createPage();
      pages.push(page);
      placeEntry(page, entry);
    }
  });

  pages.forEach((page, index) => {
    if (page.entries.length === 0) {
      return;
    }

    const atlasKey = `${RUNTIME_SPRITE_ATLAS_PREFIX}-${atlasPageCount + index + 1}`;

    if (scene.textures.exists(atlasKey)) {
      scene.textures.remove(atlasKey);
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(MAX_ATLAS_SIZE, Math.max(1, page.width));
    canvas.height = Math.min(MAX_ATLAS_SIZE, Math.max(1, page.height));

    const context = canvas.getContext('2d');
    context.imageSmoothingEnabled = false;

    page.entries.forEach((entry) => {
      context.drawImage(entry.image, entry.x, entry.y);
    });

    const texture = scene.textures.addCanvas(atlasKey, canvas);

    page.entries.forEach((entry) => {
      texture.add(entry.key, 0, entry.x, entry.y, entry.width, entry.height);
      atlasFrameKeys.set(entry.key, atlasKey);
    });
  });

  atlasPageCount += pages.length;
}

export function getTextureArgs(textureKey) {
  const atlasKey = atlasFrameKeys.get(textureKey);

  return atlasKey ? [atlasKey, textureKey] : [textureKey];
}

export function getAnimationFrame(textureKey) {
  const atlasKey = atlasFrameKeys.get(textureKey);

  return atlasKey
    ? { key: atlasKey, frame: textureKey }
    : { key: textureKey };
}

export function setSpriteTexture(gameObject, textureKey) {
  gameObject.setTexture(...getTextureArgs(textureKey));
  gameObject.setData?.('logicalTextureKey', textureKey);

  return gameObject;
}

export function getLogicalTextureKey(gameObject) {
  return gameObject?.getData?.('logicalTextureKey') ?? gameObject?.texture?.key;
}
