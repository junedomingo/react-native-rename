/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const {
  createFixtureProject,
  getStagedDiff,
  getStagedNameStatus,
  readFixtureFile,
  runRename,
} = require('./helpers/fixture');

const activeVersions = ['0.77.1'];

const expectCommonRename = cwd => {
  const appJson = JSON.parse(readFixtureFile(cwd, 'app.json'));
  const androidStrings = readFixtureFile(cwd, 'android/app/src/main/res/values/strings.xml');
  const androidSettings = readFixtureFile(cwd, 'android/settings.gradle');
  const iosInfoPlist = readFixtureFile(cwd, 'ios/TravelApp/Info.plist');

  expect(appJson.name).toBe('Travel App');
  expect(appJson.displayName).toBe('Travel App');
  expect(androidSettings).toContain('rootProject.name = "Travel App"');
  expect(androidStrings).toContain('<string name="app_name">Travel App</string>');
  expect(iosInfoPlist).toContain('<string>Travel App</string>');
  expect(fs.existsSync(path.join(cwd, 'ios/TravelApp.xcodeproj'))).toBe(true);
  expect(fs.existsSync(path.join(cwd, 'ios/TravelApp.xcworkspace'))).toBe(true);
};

const expectIosBundleId = (cwd, bundleId) => {
  const pbxproj = readFixtureFile(cwd, 'ios/TravelApp.xcodeproj/project.pbxproj');

  expect(pbxproj).toContain(`PRODUCT_BUNDLE_IDENTIFIER = "${bundleId}"`);
};

const expectAndroidBundleId = (cwd, bundleId) => {
  const buildGradle = readFixtureFile(cwd, 'android/app/build.gradle');
  const mainActivity = path.join(
    cwd,
    'android/app/src/main/java/com/example/travelapp/MainActivity.kt'
  );
  const mainApplication = path.join(
    cwd,
    'android/app/src/main/java/com/example/travelapp/MainApplication.kt'
  );

  expect(buildGradle).toContain(`namespace "${bundleId}"`);
  expect(buildGradle).toContain(`applicationId "${bundleId}"`);
  expect(fs.existsSync(mainActivity)).toBe(true);
  expect(fs.existsSync(mainApplication)).toBe(true);
};

describe.each(activeVersions)('rn-versions/%s', version => {
  test('changes app name', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App"');

    expectCommonRename(project.cwd);
    expect(getStagedDiff(project.cwd)).toContain('Travel App');
    expect(getStagedNameStatus(project.cwd)).toContain('TravelApp.xcodeproj');
  });

  test('changes app name and bundle id for both ios and android', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" -b com.example.travelapp');

    expectCommonRename(project.cwd);
    expectIosBundleId(project.cwd, 'com.example.travelapp');
    expectAndroidBundleId(project.cwd, 'com.example.travelapp');
  });

  test('changes app name and bundle id for android only', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" --androidBundleID com.example.travelapp');

    expectCommonRename(project.cwd);
    expectAndroidBundleId(project.cwd, 'com.example.travelapp');
    const pbxproj = readFixtureFile(project.cwd, 'ios/TravelApp.xcodeproj/project.pbxproj');
    expect(pbxproj).toContain(
      'PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)"'
    );
  });

  test('changes app name and bundle id for ios only', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" --iosBundleID com.example.travelapp');

    expectCommonRename(project.cwd);
    expectIosBundleId(project.cwd, 'com.example.travelapp');
    expect(
      fs.existsSync(path.join(project.cwd, 'android/app/src/main/java/com/awesomeproject'))
    ).toBe(true);
  });
});
