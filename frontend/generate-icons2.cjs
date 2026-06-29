const Jimp = require('jimp');
const fs = require('fs');

async function processIcons() {
  try {
    console.log("Loading image...");
    const imagePath = 'D:\\Synapse\\frontend\\images\\synapse-logo.png';
    const original = await Jimp.read(imagePath);
    
    // 1. 192x192
    const img192 = original.clone().resize(192, 192);
    await img192.writeAsync('D:\\Synapse\\frontend\\public\\pwa-192x192.png');
    console.log("Created pwa-192x192.png");

    // 2. 512x512
    const img512 = original.clone().resize(512, 512);
    await img512.writeAsync('D:\\Synapse\\frontend\\public\\pwa-512x512.png');
    console.log("Created pwa-512x512.png");

    // 3. Maskable
    // Find bounding box
    const w = original.bitmap.width;
    const h = original.bitmap.height;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const hex = original.getPixelColor(x, y);
        const rgba = Jimp.intToRGBA(hex);
        // Assuming white background. A non-white pixel is part of the logo.
        if (rgba.r < 250 || rgba.g < 250 || rgba.b < 250) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    
    const bbWidth = maxX - minX + 1;
    const bbHeight = maxY - minY + 1;
    
    console.log(`Original Size: ${w}x${h}`);
    console.log(`Bounding Box: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
    console.log(`Bounding Box Size: ${bbWidth}x${bbHeight}`);
    
    // Calculate percentage of canvas used by bounding box
    const pctX = (bbWidth / w) * 100;
    const pctY = (bbHeight / h) * 100;
    console.log(`Symbol bounding box occupies ${pctX.toFixed(1)}% of width and ${pctY.toFixed(1)}% of height.`);
    
    let maskable = original.clone();
    
    if (pctX > 80 || pctY > 80) {
      console.log(`Symbol bounding box exceeds the 80% safe zone, adding additional padding.`);
      
      const maxDim = Math.max(bbWidth, bbHeight);
      const newCanvasSize = Math.ceil(maxDim / 0.7); // target 70% of canvas
      
      const croppedSymbol = original.clone().crop(minX, minY, bbWidth, bbHeight);
      
      const paddedCanvas = new Jimp(newCanvasSize, newCanvasSize, '#FFFFFF');
      const pasteX = Math.floor((newCanvasSize - bbWidth) / 2);
      const pasteY = Math.floor((newCanvasSize - bbHeight) / 2);
      paddedCanvas.composite(croppedSymbol, pasteX, pasteY);
      
      maskable = paddedCanvas;
    } else {
      console.log(`Symbol already fits within the safe zone, no extra padding needed.`);
    }
    
    maskable.resize(512, 512);
    await maskable.writeAsync('D:\\Synapse\\frontend\\public\\pwa-maskable-512x512.png');
    console.log("Created pwa-maskable-512x512.png");
    
  } catch (err) {
    console.error(err);
  }
}

processIcons();
