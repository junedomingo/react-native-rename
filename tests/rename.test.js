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

const activeVersions = ['0.77.1', '0.81.6', '0.85.3'];
const originalAndroidBundlePaths = {
  '0.77.1': 'com/awesomeproject',
  '0.81.6': 'com/awesomeproject081',
  '0.85.3': 'com/awesomeproject085',
};

const getIosWorkspaceNames = cwd =>
  fs.readdirSync(path.join(cwd, 'ios')).filter(filename => filename.endsWith('.xcworkspace'));

const getOriginalIosWorkspaceNames = version =>
  getIosWorkspaceNames(path.join(__dirname, 'rn-versions', version));

const expectIosWorkspaceRename = (cwd, version) => {
  const originalWorkspaceNames = getOriginalIosWorkspaceNames(version);
  const currentWorkspaceNames = getIosWorkspaceNames(cwd);
  const expectedWorkspaceNames = originalWorkspaceNames.map(filename =>
    filename.replace(/^[^.]+(?=\.xcworkspace$)/, 'TravelApp')
  );

  expect([...currentWorkspaceNames].sort()).toEqual([...expectedWorkspaceNames].sort());
};

const expectCommonRename = (cwd, version) => {
  const appJson = JSON.parse(readFixtureFile(cwd, 'app.json'));
  const androidStrings = readFixtureFile(cwd, 'android/app/src/main/res/values/strings.xml');
  const androidSettings = readFixtureFile(cwd, 'android/settings.gradle');
  const iosInfoPlist = readFixtureFile(cwd, 'ios/TravelApp/Info.plist');
  const appDelegate = readFixtureFile(cwd, 'ios/TravelApp/AppDelegate.swift');

  expect(appJson.name).toBe('Travel App');
  expect(appJson.displayName).toBe('Travel App');
  expect(androidSettings).toContain('rootProject.name = "Travel App"');
  expect(androidStrings).toContain('<string name="app_name">Travel App</string>');
  expect(iosInfoPlist).toContain('<string>Travel App</string>');
  expect(appDelegate).toMatch(/(self\.moduleName =|withModuleName:) "Travel App"/);
  expect(fs.existsSync(path.join(cwd, 'ios/TravelApp.xcodeproj'))).toBe(true);
  expectIosWorkspaceRename(cwd, version);
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

    expectCommonRename(project.cwd, version);
    expect(getStagedDiff(project.cwd)).toContain('Travel App');
    expect(getStagedNameStatus(project.cwd)).toContain('TravelApp.xcodeproj');
  });

  test('stages rename changes after a successful run', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App"');

    expect(getStagedNameStatus(project.cwd)).toContain('M');
    expect(getStagedNameStatus(project.cwd)).toContain('TravelApp');
  });

  test('changes app name and bundle id for both ios and android', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" -b com.example.travelapp');

    expectCommonRename(project.cwd, version);
    expectIosBundleId(project.cwd, 'com.example.travelapp');
    expectAndroidBundleId(project.cwd, 'com.example.travelapp');
  });

  test('changes app name and bundle id for android only', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" --androidBundleID com.example.travelapp');

    expectCommonRename(project.cwd, version);
    expectAndroidBundleId(project.cwd, 'com.example.travelapp');
    const pbxproj = readFixtureFile(project.cwd, 'ios/TravelApp.xcodeproj/project.pbxproj');
    expect(pbxproj).toContain(
      'PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)"'
    );
  });

  test('changes app name and bundle id for ios only', () => {
    const project = createFixtureProject(version);

    runRename(project.cwd, '"Travel App" --iosBundleID com.example.travelapp');

    expectCommonRename(project.cwd, version);
    expectIosBundleId(project.cwd, 'com.example.travelapp');
    expect(
      fs.existsSync(
        path.join(project.cwd, 'android/app/src/main/java', originalAndroidBundlePaths[version])
      )
    ).toBe(true);
  });
});
