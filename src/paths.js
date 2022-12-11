import { clearName, escapeXmlEntities } from './utils';

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
  const escapedNewName = escapeXmlEntities(newName);

  // IMPORTANT: app.json file should be last in the array
  // because it contains the name of the app
  // and it should be changed last.
  // also "files:" should be in array even if there is only one file
  return [
    {
      files: ['android/app/src/main/res/values/strings.xml'],
      from: new RegExp(`\\b${currentName}\\b`, 'gi'),
      to: escapedNewName,
    },
    {
      files: ['index.js', 'index.android.js', 'index.ios.js'],
      from: [new RegExp(`\\b${currentName}\\b`, 'g'), new RegExp(`\\b'${currentName}'\\b`, 'g')],
      to: newName,
    },
    {
      files: [
        `ios/*.xcodeproj/project.pbxproj`,
        `ios/*.xcworkspace/contents.xcworkspacedata`,
        `ios/*.xcodeproj/xcshareddata/xcschemes/*-tvOS.xcscheme`,
        `ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`,
        `ios/*/AppDelegate.m`,
        'ios/*/AppDelegate.mm',
        'android/settings.gradle',
        `ios/*Tests/*Tests.m`,
        'ios/build/info.plist',
        'ios/Podfile',
      ],
      from: new RegExp(`\\b${clearedCurrentName}\\b`, 'gi'),
      to: clearedNewName,
    },
    {
      files: [
        `ios/*.xcodeproj/project.pbxproj`,
        `ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme`,
        `ios/*Tests/*Tests.m`,
        'ios/Podfile',
      ],
      from: new RegExp(`\\b${clearedCurrentName}Tests\\b`, 'gi'),
      to: `${clearedNewName}Tests`,
    },
    {
      files: [`ios/*/Base.lproj/LaunchScreen.xib`, 'ios/*/LaunchScreen.storyboard'],
      from: new RegExp(`\\b${currentName}\\b`, 'gi'),
      to: newName,
    },
    {
      files: [`ios/*/Info.plist`],
      from: new RegExp(`\\b${currentName}\\b`, 'gi'),
      to: escapedNewName,
    },
    {
      files: [`android/app/src/main/java/*/*/MainActivity.java`],
      from: new RegExp(`return "${currentName}";`, 'gi'),
      to: `return "${newName}";`,
    },
    {
      files: [
        'android/app/src/main/jni/CMakeLists.txt',
        'android/app/src/main/java/*/*/newarchitecture/modules/MainApplicationTurboModuleManagerDelegate.java',
      ],
      from: new RegExp(`\\b${clearedCurrentName.toLowerCase()}_appmodules\\b`, 'gi'),
      to: `${clearedNewName.toLowerCase()}_appmodules`,
    },
    {
      files: ['package.json'],
      from: `"name": "${clearedCurrentName.toLowerCase()}"`,
      to: `"name": "${clearedNewName.toLowerCase()}"`,
    },
    {
      files: ['app.json'],
      from: new RegExp(`\\b${currentName}\\b`, 'gi'),
      to: newName,
    },
  ];
};
