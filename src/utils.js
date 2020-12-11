import fs from 'fs';
import path from 'path';
import cheerio from 'cheerio';

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  });
}

export const loadAppConfig = () => readFile(path.join(__dirname, 'app.json')).then(data => JSON.parse(data));

export const loadAndroidManifest = () => readFile(path.join(__dirname, 'android/app/src/main/AndroidManifest.xml')).then(data => cheerio.load(data));
