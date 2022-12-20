#!/usr/bin/env node
import { program } from 'commander';

import pjson from '../package.json';
import {
  checkGitRepoStatus,
  getAndroidCurrentName,
  getIosCurrentName,
  getIosXcodeProjectPathName,
  gitStageChanges,
  modifyIosFilesContent,
  modifyOtherFilesContent,
  renameIosFoldersAndFiles,
  showSuccessMessages,
  validateCreation,
  validateGitRepo,
  validateNewName,
  validatePathContentStr,
} from './utils';

program
  .name(pjson.name)
  .description(pjson.description)
  .version(pjson.version)
  .arguments('[newName]')
  .option('-b, --bundleID [value]', 'Set custom bundle identifier eg. "com.junedomingo.travelapp"')
  .option(
    '-p, --pathContentStr [value]',
    `Path and content string that can be used in replacing folders, files and their content. Make sure it doesn't include any special characters. eg. "Travelapp"`
  )
  .action(async newName => {
    validateNewName(newName, program.opts());

    const pathContentStr = program.opts().pathContentStr;
    if (pathContentStr) {
      validatePathContentStr(pathContentStr);
    }

    const currentAndroidName = getAndroidCurrentName();
    const currentIosName = getIosCurrentName();
    const currentPathContentStr = getIosXcodeProjectPathName();
    const newPathContentStr = pathContentStr || newName;

    await renameIosFoldersAndFiles(newPathContentStr);
    await modifyIosFilesContent({
      currentName: currentIosName,
      newName,
      currentPathContentStr,
      newPathContentStr,
    });
    await modifyOtherFilesContent({ newName, newPathContentStr });
    showSuccessMessages(newName);
    gitStageChanges();
  });

// If no arguments are passed, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}

validateGitRepo();
checkGitRepoStatus();
validateCreation();
program.parseAsync(process.argv);

// TODO
// - [ ] Add support for Android
// - [ ] Add support for Windows
// - [ ] Add support for macOS
// - [ ] Check if the new name is too short
// - [ x ] Check if the new name is too long
// - [ x ] Check if the new name for modifying files is too short
// - [ x ] Check package.json, should not contain special characters
// - [ x ] Test pbxproj for other languages
// - [  ] Change bundle identifier on ios
// - [  ] Change bundle identifier on android
// - [  ] Add option to add iosNewName
// - [  ] Add option to add androidNewName
// - [ x ] Add option to add custom file and folder name e.g "AwesomeApp"
// - [ ] Add ios DisplayName
