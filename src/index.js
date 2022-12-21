#!/usr/bin/env node
import { program } from 'commander';

import pjson from '../package.json';
import {
  checkGitRepoStatus,
  getAndroidCurrentName,
  getIosCurrentName,
  getIosXcodeProjectPathName,
  gitStageChanges,
  updateIosFilesContent,
  updateOtherFilesContent,
  renameIosFoldersAndFiles,
  showSuccessMessages,
  validateBundleID,
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
    `Path and content string that can be used in replacing folders, files and their content. Make sure it doesn't include any special characters.`
  )
  .option('--skipGitStatusCheck', 'Skip git repo status check')
  .action(async newName => {
    const options = program.opts();

    if (!options.skipGitStatusCheck) {
      checkGitRepoStatus();
    }

    validateNewName(newName, options);

    const pathContentStr = options.pathContentStr;
    const bundleID = options.bundleID;

    if (pathContentStr) {
      validatePathContentStr(pathContentStr);
    }

    if (bundleID) {
      validateBundleID(bundleID);
    }

    const currentAndroidName = getAndroidCurrentName();
    const currentIosName = getIosCurrentName();
    const currentPathContentStr = getIosXcodeProjectPathName();
    const newPathContentStr = pathContentStr || newName;
    await renameIosFoldersAndFiles(newPathContentStr);
    await updateIosFilesContent({
      currentName: currentIosName,
      newName,
      currentPathContentStr,
      newPathContentStr,
      bundleID: options.bundleID,
    });
    await updateOtherFilesContent({ newName, newPathContentStr });
    showSuccessMessages(newName);
    gitStageChanges();
  });

// If no arguments are passed, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}

validateGitRepo();
validateCreation();
program.parseAsync(process.argv);

// TODO
// - [ ] Add support for Android
// - [ x ] Check if the new name is too long
// - [ x ] Check if the new name for modifying files is too short
// - [ x ] Check package.json, should not contain special characters
// - [ x ] Test pbxproj for other languages
// - [ x ] Change bundle identifier on ios
// - [  ] Change bundle identifier on android
// - [  ] Add option to add iosNewName
// - [  ] Add option to add androidNewName
// - [ x ] Add option to add custom file and folder name e.g "AwesomeApp"
// - [ x ] Add ios DisplayName
