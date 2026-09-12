const { app, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

app.whenReady().then(async () => {
  try {
    const rawPath = path.join(__dirname, '../build/icon.png');
    const img = nativeImage.createFromPath(rawPath);
    const resized = img.resize({ width: 256, height: 256 });
    const pngBuf = resized.toPNG();
    fs.writeFileSync(rawPath, pngBuf);
    console.log('Created 256x256 build/icon.png, size:', pngBuf.length);

    const pngToIco = require('png-to-ico').default;
    const icoBuf = await pngToIco(rawPath);
    fs.writeFileSync(path.join(__dirname, '../build/icon.ico'), icoBuf);
    console.log('Created build/icon.ico, size:', icoBuf.length);
  } catch (err) {
    console.error('Error creating icons:', err);
  } finally {
    app.quit();
  }
});
