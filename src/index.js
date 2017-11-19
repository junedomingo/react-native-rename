#!/usr/bin/env node

// nS - No Space
// lC - Lowercase

import cheerio from 'cheerio';
import colors from 'colors';
import fs from 'fs';
import program from 'commander';
import replace from 'node-replace';
import shell from 'shelljs';
import pjson from '../package.json';
import { foldersAndFiles } from './config/foldersAndFiles';
import { filesToModifyContent } from './config/filesToModifyContent';
import { bundleIdentifiers } from './config/bundleIdentifiers';

const projectName = pjson.name;
const replaceOptions = {
  recursive: true,
  silent: true,
};

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(data);
    });
  });
}

function replaceContent(regex, replacement, paths) {
  replace({
    regex,
    replacement,
    paths,
    ...replaceOptions,
  });

  for (const path of paths) {
    console.log(`${path} ${colors.green('MODIFIED')}`);
  }
}

readFile('./android/app/src/main/res/values/strings.xml')
  .then(data => {
    const $ = cheerio.load(data);
    const currentAppName = $('string[name=app_name]').text();
    const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
    const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase();

    program
      .version('2.1.8')
      .arguments('<newName>')
      .option(
        '-b, --bundleID [value]',
        'Set custom bundle identifier eg. "com.junedomingo.travelapp"'
      )
      .action(newName => {
        const nS_NewName = newName.replace(/\s/g, '');
        const pattern = /^([0-9]|[a-z])+([0-9a-z\s]+)$/i;
        const lC_Ns_NewAppName = nS_NewName.toLowerCase();
        const bundleID = program.bundleID ? program.bundleID.toLowerCase() : null;
        let newBundlePath;

        if (bundleID) {
          newBundlePath = bundleID.replace(/\./g, '/');
          const id = bundleID.split('.');
          if (id.length < 2)
            return console.log(
              'Invalid Bundle Identifier. Add something like "com.travelapp" or "com.junedomingo.travelapp"'
            );
        }

        if (!pattern.test(newName)) {
          return console.log(
            `"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`
          );
        }

        if (
          newName === currentAppName ||
          newName === nS_CurrentAppName ||
          newName === lC_Ns_CurrentAppName
        ) {
          return console.log(`Please try a different name.`);
        }

        console.log(
          `${colors.yellow(
            'Please make sure to run "watchman watch-del-all" and "npm start --reset-cache" after renaming the app. '
          )}`
        );

        // Clean builds on both platform
        shell.rm('-rf', [
          './ios/build/*',
          './android/.gradle/*',
          './android/app/build/*',
          './android/build/*',
        ]);

        // Move files and folders from ./config/foldersAndFiles.js
        foldersAndFiles(currentAppName, newName).forEach((element, index) => {
          const dest = element.replace(new RegExp(nS_CurrentAppName, 'gi'), nS_NewName);
          setTimeout(() => {
            if (fs.existsSync(element) || !fs.existsSync(element)) {
              if (shell.exec(`git mv ${element} ${dest}`).code === 0) {
                console.log(`${dest} ${colors.green('RENAMED')}`);
              } else {
                console.log("Ignore above error if this file doesn't exist");
              }
            }
          }, 600 * index);
        });

        // Modify file content from ./config/filesToModifyContent.js
        setTimeout(() => {
          filesToModifyContent(currentAppName, newName, projectName).map(file => {
            file.paths.map((path, index) => {
              const newPaths = [];
              if (fs.existsSync(path)) {
                newPaths.push(path);
                setTimeout(() => {
                  replaceContent(file.regex, file.replacement, newPaths);
                }, 500 * index);
              }
            });
          });
        }, 8000);

        setTimeout(() => {
          readFile('./android/app/src/main/AndroidManifest.xml').then(data => {
            const $ = cheerio.load(data);
            const currentBundleID = $('manifest').attr('package');
            const newBundleID = program.bundleID ? bundleID : `com.${lC_Ns_NewAppName}`;
            const javaFileBase = './android/app/src/main/java';
            const newJavaPath = `${javaFileBase}/${newBundleID.replace(/\./g, '/')}`;
            const currentJavaPath = `${javaFileBase}/${currentBundleID.replace(/\./g, '/')}`;
            const javaFiles = [`MainActivity.java`, `MainApplication.java`];

            if (bundleID) {
              newBundlePath = newJavaPath;
            } else {
              newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
              newBundlePath = `${javaFileBase}/${newBundlePath}`;
            }

            // Create new bundle folder if doesn't exist yet
            if (!fs.existsSync(newBundlePath)) {
              fs.mkdirSync(newBundlePath);
            }

            // Move javaFiles
            for (const file of javaFiles) {
              if (
                shell.exec(`git mv ${currentJavaPath}/${file} ${newBundlePath}/${file} -f`).code ===
                0
              ) {
                console.log(`${newBundlePath} ${colors.green('BUNDLE INDENTIFIER CHANGED')}`);
              } else {
                console.log(`ERROR: git mv ${currentJavaPath}/${file} ${newBundlePath}/${file} -f`);
              }
            }

            // Modify file content from ./config/bundleIdentifiers.js
            setTimeout(function() {
              bundleIdentifiers(
                currentAppName,
                newName,
                projectName,
                currentBundleID,
                newBundleID,
                newBundlePath
              ).map(file => {
                file.paths.map((path, index) => {
                  const newPaths = [];
                  if (fs.existsSync(path)) {
                    newPaths.push(path);
                    setTimeout(() => {
                      replaceContent(file.regex, file.replacement, newPaths);
                    }, 500 * index);
                  }
                });
              });
            }, 2000);
          });
        }, 10000);
      })
      .parse(process.argv);
    if (!process.argv.slice(2).length) program.outputHelp();
  })
  .catch(err => {
    if (err.code === 'ENOENT')
      return console.log('Directory should be created using "react-native init"');

    return console.log('Something went wrong: ', err);
  });
