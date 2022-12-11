#!/usr/bin/env node
import { program } from 'commander';

import pjson from '../package.json';
import {
  getCurrentName,
  gitStageChanges,
  modifyFilesContent,
  renameFoldersAndFiles,
  validateCreation,
  validateNewName,
} from './utils';

program
  .name(pjson.name)
  .description(pjson.description)
  .version(pjson.version)
  .arguments('[newName]')
  .option('-b, --bundleID [value]', 'Set custom bundle identifier eg. "com.junedomingo.travelapp"')
  .action(async argName => {
    const currentName = await getCurrentName();
    const newName = argName || currentName;
    validateNewName(newName);
    await renameFoldersAndFiles(currentName, newName);
    await modifyFilesContent(currentName, newName);
    gitStageChanges();
  });

// If no arguments are passed, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  process.exit();
}

(async () => {
  await validateCreation();
  await program.parseAsync(process.argv);
})();
