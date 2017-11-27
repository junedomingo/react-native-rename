// nS - No Space
// lC - Lowercase

export function bundleIdentifiers(currentAppName, newName, projectName, currentBundleID, newBundleID, newBundlePath) {
  const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
  const nS_NewName = newName.replace(/\s/g, '');
  const lC_Ns_CurrentBundleID = currentBundleID.toLowerCase();
  const lC_Ns_NewBundleID = newBundleID.toLowerCase();

  return [
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: ['android/app/BUCK', 'android/app/build.gradle', 'android/app/src/main/AndroidManifest.xml'],
    },
    {
      regex: currentBundleID,
      replacement: newBundleID,
      paths: [`${newBundlePath}/MainActivity.java`, `${newBundlePath}/MainApplication.java`],
    },
    {
      regex: lC_Ns_CurrentBundleID,
      replacement: lC_Ns_NewBundleID,
      paths: [`${newBundlePath}/MainApplication.java`],
    },
    {
      regex: nS_CurrentAppName,
      replacement: nS_NewName,
      paths: [`${newBundlePath}/MainActivity.java`],
    },
  ];
}
