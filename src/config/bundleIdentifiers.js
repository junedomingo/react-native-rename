// nS - No Space
// lC - Lowercase
import globby from 'globby';
import { clearAppName } from '../utils';

export function bundleIdentifiers({ currentAppName, newName, currentBundleID, newBundleID, newBundlePath }) {
  const nS_CurrentAppName = clearAppName(currentAppName);
  const nS_NewName = clearAppName(newName);

  return [
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: ['android/app/BUCK', 'android/app/build.gradle', 'android/app/src/main/AndroidManifest.xml'],
    },
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: globby.sync([`${newBundlePath}/**/*.java`]),
    },
    {
      // App name (probably) doesn't start with `.`, but the bundle ID will
      // include the `.`. This fixes a possible issue where the bundle ID
      // also contains the app name and prevents it from being inappropriately
      // replaced by an update to the app name with the same bundle ID
      regex: new RegExp(`(?!\\.)(.|^)${nS_CurrentAppName}`, 'g'),
      replacement: `$1${nS_NewName}`,
      paths: [`${newBundlePath}/MainActivity.java`],
    },
  ];
}
