#!/usr/bin/env node
import { program } from 'commander';

import pjson from '../package.json';
import {
  bundleIDToPath,
  checkGitRepoStatus,
  getAndroidCurrentBundleID,
  getAndroidCurrentName,
  getIosCurrentName,
  getIosXcodeProjectPathName,
  gitStageChanges,
  renameAndroidBundleIDFolders,
  renameIosFoldersAndFiles,
  showSuccessMessages,
  updateAndroidFilesContent,
  updateAndroidFilesContentBundleID,
  updateIosFilesContent,
  updateOtherFilesContent,
  validateCreation,
  validateGitRepo,
  validateNewBundleID,
  validateNewName,
  validateNewPathContentStr,
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
    const newBundleID = options.bundleID?.toLowerCase();

    if (pathContentStr) {
      validateNewPathContentStr(pathContentStr);
    }

    if (newBundleID) {
      validateNewBundleID(newBundleID);
    }

    const currentAndroidName = getAndroidCurrentName();
    const currentIosName = getIosCurrentName();
    const currentPathContentStr = getIosXcodeProjectPathName();
    const newPathContentStr = pathContentStr || newName;
    const currentAndroidBundleID = getAndroidCurrentBundleID();

    await renameIosFoldersAndFiles(newPathContentStr);
    await updateIosFilesContent({
      currentName: currentIosName,
      newName,
      currentPathContentStr,
      newPathContentStr,
      newBundleID,
    });

    if (newBundleID) {
      await renameAndroidBundleIDFolders({
        currentBundleIDAsPath: bundleIDToPath(currentAndroidBundleID),
        newBundleIDAsPath: bundleIDToPath(newBundleID),
      });
    }

    await updateAndroidFilesContent({
      currentName: currentAndroidName,
      newName,
      newBundleIDAsPath: bundleIDToPath(newBundleID || currentAndroidBundleID),
    });

    if (newBundleID) {
      await updateAndroidFilesContentBundleID({
        currentBundleID: currentAndroidBundleID,
        newBundleID,
        currentBundleIDAsPath: bundleIDToPath(currentAndroidBundleID),
        newBundleIDAsPath: bundleIDToPath(newBundleID),
      });
    }
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
// - [ x ] Add support for Android
// - [ x ] Check if the new name is too long
// - [ x ] Check if the new name for modifying files is too short
// - [ x ] Check package.json, should not contain special characters
// - [ x ] Test pbxproj for other languages
// - [ x ] Change bundle identifier on ios
// - [ x ] Change bundle identifier on android
// - [  ] Add option to add iosNewName
// - [  ] Add option to add androidNewName
// - [ x ] Add option to add custom file and folder name e.g "AwesomeApp"
// - [ x ] Add ios DisplayName
// - [  ] Delete builds folder
