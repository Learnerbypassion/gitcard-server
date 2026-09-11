const Jimp = require('jimp');

async function test() {
  const img = await Jimp.read('avatar.png');
  // Check some pixel colors
  let isGrayscale = true;
  for (let i = 0; i < 1000; i++) {
    const x = Math.floor(Math.random() * img.bitmap.width);
    const y = Math.floor(Math.random() * img.bitmap.height);
    const idx = img.getPixelIndex(x, y);
    const r = img.bitmap.data[idx];
    const g = img.bitmap.data[idx + 1];
    const b = img.bitmap.data[idx + 2];
    if (r !== g || g !== b) {
      isGrayscale = false;
      break;
    }
  }
  console.log('isGrayscale:', isGrayscale);
}

test();
