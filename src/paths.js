import { cleanString, encodeXmlEntities } from './utils';

export const androidManifestXml = 'android/app/src/main/AndroidManifest.xml';
export const iosXcodeproj = 'ios/*.xcodeproj';
export const iosPbxProject = 'ios/*.xcodeproj/project.pbxproj';
export const iosPlist = 'ios/*/Info.plist';
export const androidValuesStrings = 'android/app/src/main/res/values/strings.xml';
export const appJson = 'app.json';

export const getIosFoldersAndFilesPaths = (currentName, newName) => {
  const cleanCurrentName = cleanString(currentName);
  const cleanNewName = cleanString(newName);
  return [
    `ios/${currentName}`,
    `ios/${cleanNewName}/${currentName}.entitlements`,
    `ios/${currentName}-tvOS`,
    `ios/${currentName}-tvOSTests`,
    `ios/${currentName}.xcworkspace`,
    `ios/${currentName}Tests`,
    `ios/${cleanNewName}Tests/${currentName}Tests.m`,
    `ios/${currentName}.xcodeproj`,
    `ios/${cleanNewName}.xcodeproj/xcshareddata/xcschemes/${currentName}-tvOS.xcscheme`,
    `ios/${cleanNewName}.xcodeproj/xcshareddata/xcschemes/${currentName}.xcscheme`,
    `ios/${currentName}-Bridging-Header.h`,
  ];
};

// IMPORTANT: "files:" value should be in array even if there is only one file
export const getIosModifyFilesContentOptions = (currentName, newName) => {
  const encodedNewName = encodeXmlEntities(newName);
  const encodedCurrentName = encodeXmlEntities(currentName);
  const cleanCurrentName = cleanString(currentName);
  const cleanNewName = cleanString(newName);
  return [
    {
      files: ['index.ios.js'],
      from: [new RegExp(`\\b${currentName}\\b`, 'g'), new RegExp(`\\b'${currentName}'\\b`, 'g')],
      to: newName,
    },
    {
      files: [
        'ios/*.xcodeproj/project.pbxproj',
        'ios/*.xcworkspace/contents.xcworkspacedata',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*-tvOS.xcscheme',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
        'ios/*Tests/*Tests.m',
        'ios/Podfile',
      ],
      from: [
        new RegExp(`\\b${currentName}\\b`, 'gi'),
        new RegExp(`\\b${cleanCurrentName}\\b`, 'gi'),
      ],
      to: cleanNewName,
    },
    {
      files: ['ios/*/AppDelegate.m', 'ios/*/AppDelegate.mm'],
      from: new RegExp(`\\b${currentName}\\b`, 'gi'),
      to: newName,
    },
    {
      files: [
        'ios/*.xcodeproj/project.pbxproj',
        'ios/*Tests/*Tests.m',
        'ios/Podfile',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
      ],
      from: new RegExp(`\\b${cleanCurrentName}Tests\\b`, 'gi'),
      to: `${cleanNewName}Tests`,
    },
    {
      files: ['ios/*.xcodeproj/project.pbxproj'],
      from: [
        new RegExp(/INFOPLIST_KEY_CFBundleDisplayName = "(.*)"/, 'g'),
        new RegExp(`remoteInfo = ${cleanNewName};`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}Tests.xctest\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}Tests.m\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}.app\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/AppDelegate.h\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/AppDelegate.mm\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/Images.xcassets\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/Info.plist\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/main.m\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}/LaunchScreen.storyboard\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewName}Tests\\b`, 'gi'),
        new RegExp(`name = ${cleanNewName}Tests;`, 'gi'),
        new RegExp(`name = ${cleanNewName};`, 'g'),
        new RegExp(`productName = ${cleanNewName};`, 'g'),
        new RegExp(`productName = ${cleanNewName}Tests;`, 'g'),
        new RegExp(`INFOPLIST_FILE = ${cleanNewName}Tests/Info.plist;`, 'g'),
        new RegExp(`INFOPLIST_FILE = ${cleanNewName}/Info.plist;`, 'g'),
        new RegExp(`PRODUCT_NAME = ${cleanNewName};`, 'gi'),
      ],
      to: [
        `INFOPLIST_KEY_CFBundleDisplayName = "${newName}"`,
        `remoteInfo = "${cleanNewName}";`,
        `path = "${cleanNewName}Tests.xctest"`,
        `path = "${cleanNewName}Tests.m"`,
        `path = "${cleanNewName}.app"`,
        `path = "${cleanNewName}/AppDelegate.h"`,
        `path = "${cleanNewName}/AppDelegate.mm"`,
        `path = "${cleanNewName}/Images.xcassets"`,
        `path = "${cleanNewName}/Info.plist"`,
        `path = "${cleanNewName}/main.m"`,
        `path = "${cleanNewName}/LaunchScreen.storyboard"`,
        `path = "${cleanNewName}Tests"`,
        `name = "${newName}Tests";`,
        `name = "${newName}";`,
        `productName = "${cleanNewName}";`,
        `productName = "${cleanNewName}Tests;"`,
        `INFOPLIST_FILE = "${cleanNewName}Tests/Info.plist";`,
        `INFOPLIST_FILE = "${cleanNewName}/Info.plist";`,
        `PRODUCT_NAME = "${newName}";`,
      ],
    },
    {
      files: [
        'ios/*/Base.lproj/LaunchScreen.xib',
        'ios/*/LaunchScreen.storyboard',
        'ios/*/Info.plist',
      ],
      from: [
        new RegExp(`\\b${currentName}\\b`, 'gi'),
        new RegExp(`\\b${encodedCurrentName}\\b`, 'gi'),
      ],
      to: encodedNewName,
    },
  ];
};

export const getOtherModifyFilesContentOptions = (currentName, newName) => {
  const encodedNewName = encodeXmlEntities(newName);
  const cleanCurrentName = cleanString(currentName);
  const cleanNewName = cleanString(newName);
  return [
    {
      files: ['package.json'],
      from: [
        `"name": "${currentName.toLowerCase()}"`,
        `"name": "${cleanCurrentName.toLowerCase()}"`,
      ],
      to: `"name": "${cleanNewName.toLowerCase()}"`,
    },
    {
      files: ['app.json'],
      from: [new RegExp(/"name": "(.*)"/, 'g'), new RegExp(/"displayName": "(.*)"/, 'g')],
      to: [`"name": "${newName}"`, `"displayName": "${newName}"`],
    },
  ];
};

// export const getReplaceInFileOptions = (currentName, newName) => {
//   const clearedCurrentName = clearName(currentName);
//   const clearedNewName = clearName(newName);
//   const encodedNewName = encodeXmlEntities(newName);

//   // IMPORTANT: app.json file should be last in the array
//   // because it contains the name of the app
//   // and it should be changed last.
//   // also "files:" value should be in array even if there is only one file
//   return [
//     {
//       files: ['android/app/src/main/res/values/strings.xml'],
//       from: new RegExp(`\\b${currentName}\\b`, 'gi'),
//       to: encodedNewName,
//     },
//     {
//       files: ['index.js', 'index.android.js', 'index.ios.js'],
//       from: [new RegExp(`\\b${currentName}\\b`, 'g'), new RegExp(`\\b'${currentName}'\\b`, 'g')],
//       to: newName,
//     },
//     {
//       files: [
//         'ios/*.xcodeproj/project.pbxproj',
//         'ios/*.xcodeproj/xcshareddata/xcschemes/*-tvOS.xcscheme',
//         'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
//         'ios/*/AppDelegate.m',
//         'ios/*/AppDelegate.mm',
//         'android/settings.gradle',
//         'ios/*Tests/*Tests.m',
//         'ios/Podfile',
//       ],
//       from: new RegExp(`\\b${clearedCurrentName}\\b`, 'gi'),
//       to: clearedNewName,
//     },
//     {
//       files: [
//         'ios/*.xcodeproj/project.pbxproj',
//         'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
//         'ios/*Tests/*Tests.m',
//         'ios/Podfile',
//       ],
//       from: new RegExp(`\\b${clearedCurrentName}Tests\\b`, 'gi'),
//       to: `${clearedNewName}Tests`,
//     },
//     {
//       files: [
//         'ios/*/Base.lproj/LaunchScreen.xib',
//         'ios/*/LaunchScreen.storyboard',
//         'ios/*/Info.plist',
//         'ios/*.xcworkspace/contents.xcworkspacedata',
//       ],
//       from: new RegExp(`\\b${currentName}\\b`, 'gi'),
//       to: encodedNewName,
//     },

//     {
//       files: ['android/app/src/main/java/*/*/MainActivity.java'],
//       from: new RegExp(`return "${currentName}";`, 'gi'),
//       to: `return "${newName}";`,
//     },
//     {
//       files: [
//         'android/app/src/main/jni/CMakeLists.txt',
//         'android/app/src/main/java/*/*/newarchitecture/modules/MainApplicationTurboModuleManagerDelegate.java',
//       ],
//       from: new RegExp(`\\b${clearedCurrentName.toLowerCase()}_appmodules\\b`, 'gi'),
//       to: `${clearedNewName.toLowerCase()}_appmodules`,
//     },
//     {
//       files: ['package.json'],
//       from: `"name": "${clearedCurrentName.toLowerCase()}"`,
//       to: `"name": "${clearedNewName.toLowerCase()}"`,
//     },
//     {
//       files: ['app.json'],
//       from: new RegExp(`\\b${currentName}\\b`, 'gi'),
//       to: newName,
//     },
//   ];
// };
