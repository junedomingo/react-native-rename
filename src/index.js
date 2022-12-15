#!/usr/bin/env node
import { program } from 'commander';

import pjson from '../package.json';
import {
  checkRepositoryGitStatus,
  getAndroidCurrentName,
  getIosCurrentName,
  gitStageChanges,
  modifyIosFilesContent,
  modifyOtherFilesContent,
  renameIosFoldersAndFiles,
  showSuccessMessages,
  validateCreation,
  validateGitRepository,
  validateNewName,
} from './utils';

program
  .name(pjson.name)
  .description(pjson.description)
  .version(pjson.version)
  .arguments('[newName]')
  .option('-b, --bundleID [value]', 'set custom bundle identifier eg. "com.junedomingo.travelapp"')
  .action(async newName => {
    validateNewName(newName);
    const currentAndroidName = getAndroidCurrentName();
    const currentIosName = getIosCurrentName();
    await renameIosFoldersAndFiles(newName);
    await modifyIosFilesContent(currentIosName, newName);
    await modifyOtherFilesContent(newName);
    showSuccessMessages();
    gitStageChanges();
  });

// If no arguments are passed, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}

validateGitRepository();
checkRepositoryGitStatus();
validateCreation();
program.parseAsync(process.argv);

// TODO
// - [ ] Add support for Android
// - [ ] Add support for Windows
// - [ ] Add support for macOS
// - [ ] Check if the new name is too short
// - [ x ] Check if the new name is too long
// - [ x ] Check if the new name for modifying files is too short
// - [] Check package.json, should not contain special characters
// - [ x ] Test pbxproj for other languages
// - [  ] Change bundle identifier on ios
// - [  ] Change bundle identifier on android
// - [  ] Add option to add iosNewName
// - [  ] Add option to add androidNewName
// - [  ] Add option to add custom file and folder name e.g "AwesomeApp"
