const Jimp = require('jimp');

async function createIcon(size, filename, maskable = false) {
  // brand indigo is #5B5BD6
  const image = new Jimp(size, size, '#5B5BD6');
  
  try {
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);
    const text = 'S';
    const textWidth = Jimp.measureText(font, text);
    const textHeight = Jimp.measureTextHeight(font, text, size);
    
    image.print(
      font,
      (size - textWidth) / 2,
      (size - textHeight) / 2,
      text
    );
  } catch (e) {
    console.warn("Could not draw text for", filename, e);
  }

  await image.writeAsync('public/' + filename);
}

async function main() {
  await createIcon(192, 'pwa-192x192.png');
  await createIcon(512, 'pwa-512x512.png');
  await createIcon(512, 'pwa-maskable-512x512.png', true);
}

main().catch(console.error);
