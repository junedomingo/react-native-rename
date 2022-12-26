import { cleanString, encodeXmlEntities } from './utils';

export const androidManifestXml = 'android/app/src/main/AndroidManifest.xml';
export const androidValuesStrings = 'android/app/src/main/res/values/strings.xml';
export const androidJava = 'android/app/src/*/java';
export const iosXcodeproj = 'ios/*.xcodeproj';
export const iosPbxProject = 'ios/*.xcodeproj/project.pbxproj';
export const iosPlist = 'ios/*/Info.plist';
export const appJson = 'app.json';
export const packageJson = 'package.json';
export const buildPaths = [
  'ios/build/*',
  'android/.gradle/*',
  'android/app/build/*',
  'android/build/*',
];

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

export const getIosUpdateFilesContentOptions = ({
  currentName,
  newName,
  currentPathContentStr,
  newPathContentStr,
  newBundleID,
}) => {
  const encodedNewName = encodeXmlEntities(newName);
  const encodedCurrentName = encodeXmlEntities(currentName);
  const cleanNewPathContentStr = cleanString(newPathContentStr);

  // IMPORTANT: "files:" value should be in array even if there is only one file
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
        if (newBundleID) {
          input = input.replaceAll(
            /PRODUCT_BUNDLE_IDENTIFIER = "(.*)"/g,
            `PRODUCT_BUNDLE_IDENTIFIER = "${newBundleID}"`
          );

          input = input.replaceAll(
            /PRODUCT_BUNDLE_IDENTIFIER = (.*)/g,
            `PRODUCT_BUNDLE_IDENTIFIER = "${newBundleID}";`
          );
        }

        return input;
      },
    },
    {
      files: ['ios/*/Base.lproj/LaunchScreen.xib'],
      from: [
        new RegExp(`\\b${encodedCurrentName}\\b`, 'g'),
        new RegExp(`\\b${currentName}\\b`, 'g'),
      ],
      to: encodedNewName,
    },
    {
      files: ['ios/*/LaunchScreen.storyboard'],
      from: [
        new RegExp(`text="${encodedCurrentName}"`, 'g'),
        new RegExp(`text="${currentName}"`, 'g'),
      ],
      to: `text="${encodedNewName}"`,
    },
    // Info.plist should be in the end of the array
    {
      files: ['ios/*/Info.plist'],
      from: [
        new RegExp(`<string>${encodedCurrentName}</string>`, 'g'),
        new RegExp(`<string>${currentName}</string>`, 'g'),
      ],
      to: `<string>${encodedNewName}</string>`,
    },
  ];
};

export const getAndroidUpdateFilesContentOptions = ({
  currentName,
  newName,
  newBundleIDAsPath,
}) => {
  const encodedNewName = encodeXmlEntities(newName);
  const encodedCurrentName = encodeXmlEntities(currentName);
  const modulesName = cleanString(newName).toLowerCase();

  return [
    {
      files: ['android/settings.gradle'],
      from: [/rootProject.name = "(.*)"/g, /rootProject.name = '(.*)'/g],
      to: `rootProject.name = '${newName}'`,
    },
    {
      files: [`android/app/src/main/java/${newBundleIDAsPath}/MainActivity.java`],
      from: [`"${currentName}"`],
      to: `"${newName}"`,
    },
    {
      files: ['android/.idea/.name'],
      from: currentName,
      to: newName,
    },
    // Update *_appmodules name
    {
      files: [
        `android/app/src/main/java/${newBundleIDAsPath}/newarchitecture/modules/MainApplicationTurboModuleManagerDelegate.java`,
      ],
      from: /SoLoader\.loadLibrary\("(.*)"\)/g,
      to: `SoLoader.loadLibrary("${modulesName}_appmodules")`,
    },
    {
      files: ['android/app/src/main/jni/CMakeLists.txt'],
      from: /project\((.*)\)/g,
      to: `project(${modulesName}_appmodules)`,
    },
    {
      files: ['android/.idea/workspace.xml'],
      from: [/<module name="(.*)\.app\.main" \/>/, new RegExp(currentName, 'g')],
      to: [`<module name="${modulesName}.app.main" />`, newName],
    },
    // strings.xml should be in the end of the array
    {
      files: ['android/app/src/main/res/values/strings.xml'],
      from: [
        `<string name="app_name">${currentName}</string>`,
        `<string name="app_name">${encodedCurrentName}</string>`,
      ],
      to: `<string name="app_name">${encodedNewName}</string>`,
    },
  ];
};

export const getAndroidUpdateBundleIDOptions = ({
  currentBundleID,
  newBundleID,
  currentBundleIDAsPath,
  newBundleIDAsPath,
}) => {
  return [
    {
      files: [
        'android/app/_BUCK',
        'android/app/build.gradle',
        `android/app/src/debug/java/${newBundleIDAsPath}/ReactNativeFlipper.java`,
        `android/app/src/main/java/${newBundleIDAsPath}/MainActivity.java`,
        `android/app/src/main/java/${newBundleIDAsPath}/MainApplication.java`,
      ],
      from: new RegExp(`${currentBundleID}`, 'g'),
      to: newBundleID,
    },
    {
      files: [
        `android/app/src/main/java/${newBundleIDAsPath}/newarchitecture/MainApplicationReactNativeHost.java`,
        `android/app/src/main/java/${newBundleIDAsPath}/newarchitecture/components/MainComponentsRegistry.java`,
        `android/app/src/main/java/${newBundleIDAsPath}/newarchitecture/modules/MainApplicationTurboModuleManagerDelegate.java`,
      ],
      from: new RegExp(currentBundleID, 'g'),
      to: newBundleID,
    },
    {
      files: [
        'android/app/src/main/jni/MainApplicationTurboModuleManagerDelegate.h',
        'android/app/src/main/jni/MainComponentsRegistry.h',
      ],
      from: new RegExp(`L${currentBundleIDAsPath}`, 'g'),
      to: `L${newBundleIDAsPath}`,
    },
    {
      files: ['android/.idea/workspace.xml'],
      from: new RegExp(`${currentBundleIDAsPath}`, 'g'),
      to: newBundleIDAsPath,
    },
    {
      files: ['android/app/src/main/AndroidManifest.xml'],
      from: new RegExp(`${currentBundleID}`, 'g'),
      to: newBundleID,
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
