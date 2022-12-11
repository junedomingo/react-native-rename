import { clearName } from './utils';

export const androidManifestXml = '/android/app/src/main/AndroidManifest.xml';

export const getFoldersAndFilesPaths = (currentName, newName) => {
  const clearedCurrentName = clearName(currentName);
  const clearedNewName = clearName(newName);

  return [
    `ios/${clearedCurrentName}`,
    `ios/${clearedCurrentName}-tvOS`,
    `ios/${clearedCurrentName}-tvOSTests`,
    `ios/${clearedCurrentName}.xcodeproj`,
    `ios/${clearedNewName}.xcodeproj/xcshareddata/xcschemes/${clearedCurrentName}-tvOS.xcscheme`,
    `ios/${clearedNewName}.xcodeproj/xcshareddata/xcschemes/${clearedCurrentName}.xcscheme`,
    `ios/${clearedCurrentName}Tests`,
    `ios/${clearedNewName}Tests/${clearedCurrentName}Tests.m`,
    `ios/${clearedCurrentName}.xcworkspace`,
    `ios/${clearedNewName}/${clearedCurrentName}.entitlements`,
    `ios/${clearedCurrentName}-Bridging-Header.h`,
  ];
};

export const getReplaceInFileOptions = (currentName, newName) => {
  const clearedCurrentName = clearName(currentName);
  const clearedNewName = clearName(newName);

  // IMPORTANT: app.json file should be last in the array
  // because it contains the name of the app
  // and it should be changed last.
  // also "files:" should be in array even if there is only one file
  return [
    {
      files: ['android/app/src/main/res/values/strings.xml'],
      from: new RegExp(`/\b${currentName}\b/`, 'g'),
      to: newName,
    },
    {
      files: [
        'index.js',
        'index.android.js',
        'index.ios.js',
        `ios/*.xcodeproj/project.pbxproj`,
        `ios/*.xcworkspace/contents.xcworkspacedata`,
        `ios/*.xcodeproj/xcshareddata/xcschemes/*-tvOS.xcscheme`,
        `ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`,
        `ios/*/AppDelegate.m`,
        'android/settings.gradle',
        `ios/*Tests/*Tests.m`,
        'ios/build/info.plist',
        'ios/Podfile',
      ],
      from: new RegExp(`/\b${clearedCurrentName}\b/`, 'g'),
      to: clearedNewName,
    },
    {
      files: [`ios/*/Base.lproj/LaunchScreen.xib`],
      from: new RegExp(`/\b${currentName}\b/`, 'g'),
      to: newName,
    },
    {
      files: [`ios/*/Info.plist`],
      from: new RegExp(`/\b${currentName}\b/`, 'g'),
      to: newName,
    },
    {
      files: [`android/app/src/main/java/*/*/MainActivity.java`],
      from: new RegExp(`return "${currentName}";`, 'g'),
      to: `return "${newName}";`,
      _useGlobMatching: true,
    },
    {
      files: ['package.json'],
      from: `"name": "${clearedCurrentName.toLowerCase()}"`,
      to: `"name": "${clearedNewName.toLowerCase()}"`,
    },
    {
      files: ['app.json'],
      from: new RegExp(`/\b${currentName}\b/`, 'g'),
      to: newName,
    },
  ];
};
