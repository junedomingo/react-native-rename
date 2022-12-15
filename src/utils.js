import chalk from 'chalk';
import cheerio from 'cheerio';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { globbySync } from 'globby';
import { decode, encode } from 'html-entities';
import path from 'path';
import replace from 'replace-in-file';
import shell from 'shelljs';

import {
  androidManifestXml,
  androidValuesStrings,
  appJson,
  getIosFoldersAndFilesPaths,
  getIosModifyFilesContentOptions,
  getOtherModifyFilesContentOptions,
  iosPlist,
  iosXcodeproj,
} from './paths';

dotenv.config();

const APP_PATH = process.env.DEV_APP_PATH || process.cwd();
const NON_ALPHANUMERIC_REGEX = /[^A-Za-z0-9]/g;
const PROMISE_DELAY = 200;
const MAX_NAME_LENGTH = 30;
const MIN_NAME_LENGTH = 1;
const MIN_ALPHANUMERIC_NAME_LENGTH = 2;
const NON_LANGUAGE_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}]+/gu;

export const removeSpaces = str => str.replaceAll(' ', '');
export const encodeXmlEntities = name =>
  encode(name, { mode: 'nonAscii', level: 'xml', numeric: 'hexadecimal' });
export const decodeXmlEntities = name => decode(name, { level: 'xml' });
const pluralize = (count, noun, suffix = 'es') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const cleanString = str => str.replace(NON_LANGUAGE_ALPHANUMERIC_REGEX, '');

const androidManifestPath = path.join(APP_PATH, androidManifestXml);

export const validateCreation = () => {
  const fileExists =
    fs.existsSync(globbySync(path.join(APP_PATH, iosPlist))[0]) &&
    fs.existsSync(path.join(APP_PATH, androidValuesStrings));
  if (!fileExists) {
    console.log('Directory should be created using "react-native init"');
    process.exit();
  }
};

export const validateNewName = name => {
  const isLengthValid = name.length <= MAX_NAME_LENGTH;
  if (!isLengthValid) {
    console.log(`New app name "${name}" is too long`);
    process.exit();
  }
};

const getCurrentNameFromXml = ({ filepath, selector }) => {
  const xml = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(xml, { xmlMode: true, decodeEntities: false });
  const element = $(selector);
  return decodeXmlEntities(element.text());
};

export const getIosCurrentName = () => {
  const filepath = globbySync(path.join(APP_PATH, iosPlist))[0];
  const selector = 'dict > key:contains("CFBundleDisplayName") + string';
  return getCurrentNameFromXml({ filepath, selector });
};

export const getAndroidCurrentName = () => {
  const filepath = path.join(APP_PATH, androidValuesStrings);
  const selector = 'resources > string[name="app_name"]';
  return getCurrentNameFromXml({ filepath, selector });
};

export const storeNamesInAppJson = async ({ currentIosName, currentAndroidName, newName }) => {
  const appJsonPath = path.join(APP_PATH, appJson);
  if (!fs.existsSync(appJsonPath)) {
    console.log('app.json not found');
    process.exit();
  }
  const appJsonContent = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  appJsonContent['react-native-rename'] = {
    currentIosName,
    currentAndroidName,
    newName,
  };
  await fs.promises.writeFile(appJsonPath, JSON.stringify(appJsonContent, null, 2));
  console.log('Stored names in app.json');
};

const getIosXcodeProjectPathName = () => {
  const xcodeProjectPath = globbySync(path.join(APP_PATH, iosXcodeproj), {
    onlyDirectories: true,
  });
  return xcodeProjectPath[0].split('/').pop().replace('.xcodeproj', '');
};

const renameFoldersAndFiles = async ({ foldersAndFilesPaths, currentPathName, newName }) => {
  const promises = foldersAndFilesPaths.map(async (filePath, index) => {
    await delay(index * PROMISE_DELAY);
    const old_path = path.join(APP_PATH, filePath);
    const new_path = path.join(
      APP_PATH,
      filePath.replace(cleanString(currentPathName), cleanString(newName))
    );
    if (old_path === new_path) {
      return console.log(`.${old_path}`, chalk.yellow('NOT RENAMED'));
    }
    new Promise(resolve => {
      if (!fs.existsSync(old_path)) {
        return resolve();
      }
      const shellMove = shell.mv('-f', old_path, new_path);
      if (shellMove.code !== 0) {
        console.log(chalk.red(shellMove.stderr));
      }
      resolve();
      console.log(`.${new_path}`, chalk.green('RENAMED'));
    });
  });
  await Promise.all(promises);
};

export const renameIosFoldersAndFiles = async newName => {
  const currentPathName = getIosXcodeProjectPathName();
  const foldersAndFilesPaths = getIosFoldersAndFilesPaths(currentPathName, newName);
  await renameFoldersAndFiles({ foldersAndFilesPaths, currentPathName, newName });
};

export const modifyFilesContent = async ({ modifyFilesContentOptions, currentName, newName }) => {
  const promises = modifyFilesContentOptions
    .map(option => {
      return {
        ...option,
        countMatches: true,
        allowEmptyPaths: true,
        files: option.files.map(file => path.join(APP_PATH, file)),
      };
    })
    .map(async (option, index) => {
      await delay(index * PROMISE_DELAY);
      try {
        const results = await replace(option);
        results.map(result => {
          const hasChanged = result.hasChanged;
          const message = `${hasChanged ? 'MODIFIED' : 'NOT MODIFIED'} (${pluralize(
            result.numMatches,
            'match'
          )})`;
          console.log(`.${result.file}`, hasChanged ? chalk.green(message) : chalk.yellow(message));
        });
      } catch (error) {
        const filePath = error.message.replace('No files match the pattern:', '').trim();
        console.log(`.${filePath}`, chalk.yellow('NOT FOUND'));
      }
    });
  await Promise.all(promises);
};

export const modifyIosFilesContent = async (currentName, newName) => {
  const modifyFilesContentOptions = getIosModifyFilesContentOptions(currentName, newName);
  await modifyFilesContent({ modifyFilesContentOptions, currentName, newName });
};

export const modifyOtherFilesContent = async (currentName, newName) => {
  const modifyFilesContentOptions = getOtherModifyFilesContentOptions(currentName, newName);
  await modifyFilesContent({ modifyFilesContentOptions, currentName, newName });
};

export const getAndroidBundleID = async () => {
  const data = await fs.promises.readFile(androidManifestPath, 'utf8');
  return data.match(/package="(.*)"/)[1];
};

export const showSuccessMessages = (currentName, newName) => {
  console.log(
    `
${chalk.green('SUCCESS! 🎉 🎉 🎉')} Your app has been renamed from ${chalk.yellow(
      currentName
    )} to ${chalk.yellow(newName)}.
`,
    `${chalk.yellow(
      'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" before running the app.'
    )}`
  );
};

export const gitStageChanges = () => {
  shell.cd(APP_PATH);
  shell.exec('git add .');
};
