const sharp = require('sharp');
const path = require('path');

sharp(path.join(__dirname, 'build', 'icon.svg'))
  .resize(512, 512)
  .png()
  .toFile(path.join(__dirname, 'build', 'icon.png'))
  .then(() => {
    console.log('Icon converted successfully!');
  })
  .catch(err => {
    console.error('Error converting icon:', err);
  });