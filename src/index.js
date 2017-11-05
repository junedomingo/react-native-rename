#!/usr/bin/env node

// nS - No Space
// lC - Lowercase

import cheerio from 'cheerio';
import colors from 'colors';
import fs from 'fs';
import mv from 'mv';
import name from 'project-name';
import pathExists from 'path-exists';
import program from 'commander';
import replace from 'node-replace';
import shell from 'shelljs';
import { foldersAndFiles } from './config/foldersAndFiles';
import { filesToModifyContent } from './config/filesToModifyContent';
import { bundleIdentifiers } from './config/bundleIdentifiers';

const projectName = name();
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

function moveJavaFiles(javaFiles, currentJavaPath, newBundlePath) {
  for (const file of javaFiles) {
    mv(
      `${currentJavaPath}/${file}`,
      `${newBundlePath}/${file}`,
      {
        mkdirp: true,
      },
      err => {
        if (err) return console.log('Error in moving java files.', err);
        console.log(`${newBundlePath} ${colors.green('BUNDLE INDENTIFIER CHANGED')}`);
      }
    );
  }
}

readFile('./android/app/src/main/res/values/strings.xml')
  .then(data => {
    const $ = cheerio.load(data);
    const currentAppName = $('string[name=app_name]').text();
    const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
    const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase();

    program
      .version('2.1.6')
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

        // Clean builds on both platform
        shell.rm('-rf', [
          './ios/build/*',
          './android/.gradle/*',
          './android/app/build/*',
          './android/build/*',
        ]);

        foldersAndFiles(currentAppName, newName).forEach((element, index) => {
          const dest = element.replace(new RegExp(nS_CurrentAppName, 'gi'), nS_NewName);
          pathExists(element).then(exists => {
            setTimeout(() => {
              if (exists) {
                mv(element, dest, err => {
                  if (err) return console.log('Error in renaming folder.', err);
                  console.log(`${dest} ${colors.green('RENAMED')}`);
                });
              } else {
                // Rename children files and folders
                mv(element, dest, err => {
                  if (err) return;
                  console.log(`${dest} ${colors.green('RENAMED')}`);
                });
              }
            }, 600 * index);
          });
        });

        setTimeout(() => {
          filesToModifyContent(currentAppName, newName, projectName).map(file => {
            file.paths.map((path, index) => {
              const newPaths = [];
              pathExists(path).then(exists => {
                if (exists) {
                  newPaths.push(path);
                  setTimeout(() => {
                    replaceContent(file.regex, file.replacement, newPaths);
                  }, 500 * index);
                }
              });
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
              moveJavaFiles(javaFiles, currentJavaPath, newBundlePath);
            } else {
              newBundlePath = newBundleID.replace(/\./g, '/').toLowerCase();
              newBundlePath = `${javaFileBase}/${newBundlePath}`;
              moveJavaFiles(javaFiles, currentJavaPath, newBundlePath);
            }

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
                  pathExists(path).then(exists => {
                    if (exists) {
                      newPaths.push(path);
                      setTimeout(() => {
                        replaceContent(file.regex, file.replacement, newPaths);
                      }, 500 * index);
                    }
                  });
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
