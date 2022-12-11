import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import replace from 'replace-in-file';
import shell from 'shelljs';

import {
  APP_PATH,
  NON_ALPHANUMERIC_REGEX,
  PROMISE_DELAY,
  VALID_APP_STORE_NAME_REGEX,
  XML_ENTITIES,
  XML_ENTITIES_REGEX,
} from './constants';
import { androidManifestXml, getFoldersAndFilesPaths, getReplaceInFileOptions } from './paths';

const androidManifestPath = path.join(APP_PATH, androidManifestXml);

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
export const removeSpaces = str => str.replaceAll(' ', '');
export const clearName = name => name.replace(NON_ALPHANUMERIC_REGEX, '');
export const escapeXmlEntities = name => name.replace(XML_ENTITIES_REGEX, tag => XML_ENTITIES[tag]);
const pluralize = (count, noun, suffix = 'es') => `${count} ${noun}${count !== 1 ? suffix : ''}`;

export const validateCreation = async () => {
  const fileExists = fs.existsSync(androidManifestPath);
  if (!fileExists) {
    console.log('Directory should be created using "react-native init"');
    process.exit();
  }
};

export const getCurrentName = async () => {
  try {
    const data = await fs.promises.readFile(path.join(APP_PATH, 'app.json'), 'utf8');
    const name = JSON.parse(data).name;
    return name;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('"app.json" not found');
    } else {
      console.log('Something went wrong');
    }
    process.exit();
  }
};

export const validateNewName = name => {
  if (!name) {
    console.log('Please provide a new name');
    process.exit();
  }

  if (!VALID_APP_STORE_NAME_REGEX.test(name)) {
    console.log(
      `New app name "${name}" is invalid.
Name can only contain alphanumeric characters, spaces, and the following special characters: . _ + ' & -`
    );
    process.exit();
  }
};

export const renameFoldersAndFiles = async (currentName, newName) => {
  const foldersAndFilesPaths = getFoldersAndFilesPaths(currentName, newName);
  const promises = foldersAndFilesPaths.map(async (filePath, index) => {
    await delay(index * PROMISE_DELAY);
    const old_path = path.join(APP_PATH, filePath);
    const new_path = path.join(
      APP_PATH,
      filePath.replace(clearName(currentName), clearName(newName))
    );
    if (old_path === new_path) {
      return console.log(`.${old_path}`, chalk.yellow('NOT RENAMED'));
    }
    try {
      await fs.promises.rename(old_path, new_path);
      console.log(`.${new_path}`, chalk.green('RENAMED'));
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`.${old_path}`, chalk.yellow('NOT FOUND'));
      }
    }
  });
  await Promise.all(promises);
};

export const modifyFilesContent = async (currentName, newName) => {
  const replaceInFileOptions = getReplaceInFileOptions(currentName, newName);
  const filteredReplaceInFileOptions = replaceInFileOptions.map(option => {
    const files = option.files.map(file => path.join(APP_PATH, file));
    return { ...option, countMatches: true, allowEmptyPaths: true, files };
  });

  const promises = filteredReplaceInFileOptions.map(async (option, index) => {
    await delay(index * PROMISE_DELAY);
    try {
      const results = await replace(option);
      results.map(result => {
        result.hasChanged
          ? console.log(
              `.${result.file}`,
              chalk.green(`MODIFIED (${pluralize(result.numMatches, 'match')})`)
            )
          : console.log(
              `.${result.file}`,
              chalk.yellow(`NOT MODIFIED (${pluralize(result.numMatches, 'match')})`)
            );
      });
    } catch (error) {
      const filePath = error.message.replace('No files match the pattern:', '').trim();
      console.log(`.${filePath}`, chalk.yellow('NOT FOUND'));
    }
  });

  await Promise.all(promises);
};

export const gitStageChanges = () => {
  shell.cd(APP_PATH);
  shell.exec('git add .');
};
