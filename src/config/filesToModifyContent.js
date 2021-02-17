// nS - No Space
// lC - Lowercase

import { clearAppName, escapeEntities } from '../utils';

export function filesToModifyContent(currentAppName, newName) {
  const nS_CurrentAppName = clearAppName(currentAppName);
  const nS_NewName = clearAppName(newName);

  return [
    {
      regex: `<string name="app_name">${currentAppName}</string>`,
      replacement: `<string name="app_name">${escapeEntities(newName)}</string>`,
      paths: ['android/app/src/main/res/values/strings.xml'],
    },
    {
      regex: nS_CurrentAppName,
      replacement: nS_NewName,
      paths: [
        'index.js',
        'index.android.js',
        'index.ios.js',
        `ios/${nS_NewName}.xcodeproj/project.pbxproj`,
        `ios/${nS_NewName}.xcworkspace/contents.xcworkspacedata`,
        `ios/${nS_NewName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}-tvOS.xcscheme`,
        `ios/${nS_NewName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}.xcscheme`,
        `ios/${nS_NewName}/AppDelegate.m`,
        'android/settings.gradle',
        `ios/${nS_NewName}Tests/${nS_NewName}Tests.m`,
        'ios/build/info.plist',
        'ios/Podfile',
        'app.json',
      ],
    },
    {
      regex: `text="${currentAppName}"`,
      replacement: `text="${newName}"`,
      paths: [`ios/${nS_NewName}/Base.lproj/LaunchScreen.xib`],
    },
    {
      regex: currentAppName,
      replacement: escapeEntities(newName),
      paths: [`ios/${nS_NewName}/Info.plist`],
    },
    {
      regex: `"name": "${nS_CurrentAppName}"`,
      replacement: `"name": "${nS_NewName.toLowerCase()}"`,
      paths: ['package.json'],
    },
    {
      regex: `"displayName": "${currentAppName}"`,
      replacement: `"displayName": "${newName}"`,
      paths: ['app.json'],
    },
  ];
}
