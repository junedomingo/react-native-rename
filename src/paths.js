import { cleanString, encodeXmlEntities } from './utils';

export const androidManifestXml = 'android/app/src/main/AndroidManifest.xml';
export const iosXcodeproj = 'ios/*.xcodeproj';
export const iosPbxProject = 'ios/*.xcodeproj/project.pbxproj';
export const iosPlist = 'ios/*/Info.plist';
export const androidValuesStrings = 'android/app/src/main/res/values/strings.xml';
export const appJson = 'app.json';
export const packageJson = 'package.json';

export const getIosFoldersAndFilesPaths = ({ currentPathContentStr, newPathContentStr }) => {
  const cleanNewPathContentStr = cleanString(newPathContentStr);

  return [
    `ios/${currentPathContentStr}`,
    `ios/${cleanNewPathContentStr}/${currentPathContentStr}.entitlements`,
    `ios/${currentPathContentStr}-tvOS`,
    `ios/${currentPathContentStr}-tvOSTests`,
    `ios/${currentPathContentStr}.xcworkspace`,
    `ios/${currentPathContentStr}Tests`,
    `ios/${cleanNewPathContentStr}Tests/${currentPathContentStr}Tests.m`,
    `ios/${currentPathContentStr}.xcodeproj`,
    `ios/${cleanNewPathContentStr}.xcodeproj/xcshareddata/xcschemes/${currentPathContentStr}-tvOS.xcscheme`,
    `ios/${cleanNewPathContentStr}.xcodeproj/xcshareddata/xcschemes/${currentPathContentStr}.xcscheme`,
    `ios/${currentPathContentStr}-Bridging-Header.h`,
  ];
};

// IMPORTANT: "files:" value should be in array even if there is only one file
export const getIosUpdateFilesContentOptions = ({
  currentName,
  newName,
  currentPathContentStr,
  newPathContentStr,
  bundleID,
}) => {
  const encodedNewName = encodeXmlEntities(newName);
  const encodedCurrentName = encodeXmlEntities(currentName);
  const cleanCurrentPathContentStr = cleanString(currentPathContentStr);
  const cleanNewPathContentStr = cleanString(newPathContentStr);
  const encodedNewPathContentStr = encodeXmlEntities(newPathContentStr);
  const encodedCurrentPathContentStr = encodeXmlEntities(currentPathContentStr);

  return [
    {
      files: ['index.ios.js'],
      from: [new RegExp(`\\b${currentName}\\b`, 'g'), new RegExp(`\\b'${currentName}'\\b`, 'g')],
      to: newName,
    },
    {
      files: ['ios/Podfile'],
      from: [
        new RegExp(`\\b${currentPathContentStr}\\b`, 'g'),
        new RegExp(`\\b${currentPathContentStr}Tests\\b`, 'g'),
      ],
      to: [`${cleanNewPathContentStr}`, `${cleanNewPathContentStr}Tests`],
    },
    {
      files: ['ios/*/AppDelegate.mm', 'ios/*/AppDelegate.m'],
      from: [new RegExp(`@"${currentName}"`, 'g')],
      to: `@"${newName}"`,
    },
    {
      files: [
        'ios/*.xcodeproj/project.pbxproj',
        'ios/*.xcworkspace/contents.xcworkspacedata',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*-tvOS.xcscheme',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
        'ios/*Tests/*Tests.m',
      ],
      from: [new RegExp(`\\b${currentPathContentStr}\\b`, 'g')],
      to: cleanNewPathContentStr,
    },
    {
      files: [
        'ios/*.xcodeproj/project.pbxproj',
        'ios/*Tests/*Tests.m',
        'ios/*.xcodeproj/xcshareddata/xcschemes/*.xcscheme',
      ],
      from: new RegExp(`\\b${currentPathContentStr}Tests\\b`, 'g'),
      to: `${cleanNewPathContentStr}Tests`,
    },
    {
      files: ['ios/*.xcodeproj/project.pbxproj'],
      from: [
        new RegExp(/INFOPLIST_KEY_CFBundleDisplayName = "(.*)"/, 'g'),
        new RegExp(`remoteInfo = ${cleanNewPathContentStr};`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}Tests.xctest\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}Tests.m\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}.app\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/AppDelegate.h\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/AppDelegate.mm\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/Images.xcassets\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/Info.plist\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/main.m\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}/LaunchScreen.storyboard\\b`, 'gi'),
        new RegExp(`\\bpath = ${cleanNewPathContentStr}Tests\\b`, 'gi'),
        new RegExp(`name = ${newPathContentStr}Tests;`, 'gi'),
        new RegExp(`name = ${cleanNewPathContentStr};`, 'g'),
        new RegExp(`name = "${currentName}";`, 'g'),
        new RegExp(`productName = ${cleanNewPathContentStr};`, 'g'),
        new RegExp(`productName = "${currentName}";`, 'g'),
        new RegExp(`productName = ${newPathContentStr}Tests;`, 'g'),
        new RegExp(`INFOPLIST_FILE = ${cleanNewPathContentStr}Tests/Info.plist;`, 'g'),
        new RegExp(`INFOPLIST_FILE = ${cleanNewPathContentStr}/Info.plist;`, 'g'),
        new RegExp(`PRODUCT_NAME = "${currentName}";`, 'gi'),
        new RegExp(`PRODUCT_NAME = ${cleanNewPathContentStr};`, 'gi'),
      ],
      to: [
        `INFOPLIST_KEY_CFBundleDisplayName = "${newName}"`,
        `remoteInfo = "${cleanNewPathContentStr}";`,
        `path = "${cleanNewPathContentStr}Tests.xctest"`,
        `path = "${cleanNewPathContentStr}Tests.m"`,
        `path = "${cleanNewPathContentStr}.app"`,
        `path = "${cleanNewPathContentStr}/AppDelegate.h"`,
        `path = "${cleanNewPathContentStr}/AppDelegate.mm"`,
        `path = "${cleanNewPathContentStr}/Images.xcassets"`,
        `path = "${cleanNewPathContentStr}/Info.plist"`,
        `path = "${cleanNewPathContentStr}/main.m"`,
        `path = "${cleanNewPathContentStr}/LaunchScreen.storyboard"`,
        `path = "${cleanNewPathContentStr}Tests"`,
        `name = "${cleanNewPathContentStr}Tests";`,
        `name = "${cleanNewPathContentStr}";`,
        `name = "${cleanNewPathContentStr}";`,
        `productName = "${cleanNewPathContentStr}";`,
        `productName = "${cleanNewPathContentStr}";`,
        `productName = "${cleanNewPathContentStr}Tests;"`,
        `INFOPLIST_FILE = "${cleanNewPathContentStr}Tests/Info.plist";`,
        `INFOPLIST_FILE = "${cleanNewPathContentStr}/Info.plist";`,
        `PRODUCT_NAME = "${cleanNewPathContentStr}";`,
        `PRODUCT_NAME = "${cleanNewPathContentStr}";`,
      ],
    },
    {
      files: ['ios/*.xcodeproj/project.pbxproj'],
      processor: input => {
        const matchesDisplayName = input.match(/INFOPLIST_KEY_CFBundleDisplayName = "(.*)"/g);
        // If there is no display name, add it
        if (matchesDisplayName === null) {
          input = input.replaceAll(
            `INFOPLIST_FILE = "${cleanNewPathContentStr}/Info.plist";`,
            `INFOPLIST_FILE = "${cleanNewPathContentStr}/Info.plist";
        INFOPLIST_KEY_CFBundleDisplayName = "${newName}";`
          );
        }

        // Replace bundle ID
        if (bundleID) {
          input = input.replaceAll(
            /PRODUCT_BUNDLE_IDENTIFIER = "(.*)"/g,
            `PRODUCT_BUNDLE_IDENTIFIER = "${bundleID}"`
          );
        }

        return input;
      },
    },
    // This should be in the end of the array
    {
      files: [
        'ios/*/Base.lproj/LaunchScreen.xib',
        'ios/*/LaunchScreen.storyboard',
        'ios/*/Info.plist',
      ],
      from: [
        new RegExp(`\\b${encodedCurrentName}\\b`, 'g'),
        new RegExp(`\\b${currentName}\\b`, 'g'),
      ],
      to: encodedNewName,
    },
  ];
};

export const getOtherUpdateFilesContentOptions = ({
  newName,
  newPathContentStr,
  appJsonName,
  appJsonDisplayName,
  packageJsonName,
}) => {
  return [
    {
      files: ['package.json'],
      from: [new RegExp(`${packageJsonName}`, 'gi')],
      to: cleanString(newPathContentStr).toLowerCase(),
    },
    {
      files: ['app.json'],
      from: [new RegExp(`${appJsonName}`, 'gi'), new RegExp(`${appJsonDisplayName}`, 'gi')],
      to: newName,
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
