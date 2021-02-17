import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

const devTestRNProject = ''; // For Development eg '/Users/junedomingo/Desktop/RN49'
export const __dirname = devTestRNProject || process.cwd();

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

export const loadAppConfig = () => readFile(path.join(__dirname, 'app.json')).then(data => JSON.parse(data));

export const loadAndroidManifest = () =>
  readFile(path.join(__dirname, 'android/app/src/main/AndroidManifest.xml')).then(data => cheerio.load(data));

export const clearAppName = name => name.replace(/[^\p{Letter}\p{Number}]/gu, '');

const entities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

export const escapeEntities = name => name.replace(/[&<>]/g, tag => entities[tag]);

// https://developer.apple.com/app-store/product-page/
export const isValidAppStoreName = name => name.length > 0 && name.length <= 30;
