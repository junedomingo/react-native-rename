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
  packageJson,
} from './paths';

dotenv.config();

const APP_PATH = process.env.DEV_APP_PATH || process.cwd();
const NON_ALPHANUMERIC_REGEX = /[^A-Za-z0-9]/g;
const PROMISE_DELAY = 200;
const MAX_NAME_LENGTH = 30;
const MIN_NAME_LENGTH = 1;
const MIN_ALPHANUMERIC_NAME_LENGTH = 4;
const NON_LANGUAGE_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}]+/gu;

export const removeSpaces = str => str.replaceAll(' ', '');
export const encodeXmlEntities = name =>
  encode(name, { mode: 'nonAscii', level: 'xml', numeric: 'hexadecimal' });
export const decodeXmlEntities = name => decode(name, { level: 'xml' });
const pluralize = (count, noun, suffix = 'es') => `${count} ${noun}${count !== 1 ? suffix : ''}`;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const cleanString = str => str.replace(NON_LANGUAGE_ALPHANUMERIC_REGEX, '');

export const checkGitRepositoryStatus = () => {
  shell.cd(APP_PATH);
  const output = shell.exec('git status', { silent: true }).stdout;
  const isClean = output.includes('nothing to commit, working tree clean');

  if (!isClean) {
    console.log(
      `The directory is not clean. There are changes that have not been committed to the Git repository.
Or you can use the 'git stash' command to save your changes and return the directory to a clean state.`
    );
    process.exit();
  }
};

export const validateGitRepository = () => {
  shell.cd(APP_PATH);
  const isGitRepository =
    shell.exec('git rev-parse --is-inside-work-tree', { silent: true }).code === 0;

  if (!isGitRepository) {
    console.log('This is not a git repository');
    process.exit();
  }
};

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

  // const cleanNameLength = cleanString(name).length;
  // const isAlphanumericLengthValid = cleanNameLength >= MIN_ALPHANUMERIC_NAME_LENGTH;

  // if (!isAlphanumericLengthValid) {
  //   console.log(
  //     `New app name "${name}" is too short, it should be at least ${MIN_ALPHANUMERIC_NAME_LENGTH} characters long`
  //   );
  //   process.exit();
  // }
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
    const oldPath = path.join(APP_PATH, filePath);
    const newPath = path.join(
      APP_PATH,
      filePath.replace(cleanString(currentPathName), cleanString(newName))
    );

    if (oldPath === newPath) {
      return console.log(`.${oldPath}`, chalk.yellow('NOT RENAMED'));
    }

    new Promise(resolve => {
      if (!fs.existsSync(oldPath)) {
        return resolve();
      }

      const shellMove = shell.mv('-f', oldPath, newPath);

      if (shellMove.code !== 0) {
        console.log(chalk.red(shellMove.stderr));
      }

      resolve();
      console.log(`.${newPath}`, chalk.green('RENAMED'));
    });
  });

  await Promise.all(promises);
};

export const renameIosFoldersAndFiles = async newName => {
  const currentPathName = getIosXcodeProjectPathName();
  const foldersAndFilesPaths = getIosFoldersAndFilesPaths(currentPathName, newName);
  await renameFoldersAndFiles({ foldersAndFilesPaths, currentPathName, newName });
};

export const modifyFilesContent = async modifyFilesContentOptions => {
  const promises = modifyFilesContentOptions.map(async (option, index) => {
    await delay(index * PROMISE_DELAY);
    const updatedOption = {
      ...option,
      countMatches: true,
      allowEmptyPaths: true,
      files: option.files.map(file => path.join(APP_PATH, file)),
    };

    try {
      const results = await replace(updatedOption);

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
  await modifyFilesContent(modifyFilesContentOptions);
};

const getPackageJsonName = async () => {
  const packageJsonContent = JSON.parse(fs.readFileSync(path.join(APP_PATH, packageJson), 'utf8'));
  return packageJsonContent.name;
};

export const modifyOtherFilesContent = async newName => {
  const modifyFilesContentOptions = getOtherModifyFilesContentOptions(newName);
  await modifyFilesContent(modifyFilesContentOptions);
};

export const getAndroidBundleID = async () => {
  const data = await fs.promises.readFile(path.join(APP_PATH, androidManifestXml), 'utf8');
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
