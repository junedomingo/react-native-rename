# React Native Rename Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revive `react-native-rename` with a reliable RN `0.77+` test matrix, current fixture coverage, cleaner tooling, and a documented support policy.

**Architecture:** First stabilize the test harness so fixture runs happen in temporary git repositories and leave the worktree clean. Then update the fixture matrix to `0.77.1`, `0.81.6`, and `0.85.3`, modernize dependency/tooling drift, and only then refactor the CLI internals behind the existing command surface.

**Tech Stack:** Node.js CLI, esbuild, Jest, React Native generated native templates, git-based fixture diffs.

---

## File Structure

- `docs/superpowers/specs/2026-05-24-react-native-rename-modernization-design.md`: approved design source.
- `docs/superpowers/plans/2026-05-24-react-native-rename-modernization.md`: this implementation plan.
- `jest.config.js`: set `watchman: false` and keep test discovery stable.
- `package.json`: add reliable `pretest`, update test/build/lint scripts, and update dependencies.
- `package-lock.json`: lock dependency updates after `npm install`.
- `tests/helpers/fixture.js`: new helper for copying RN fixtures to temp directories, initializing git, running the built CLI, and reading staged diffs.
- `tests/rename.test.js`: replace direct tracked-fixture mutation with matrix tests over temp fixture copies.
- `tests/rn-versions/0.77.1`: keep as existing baseline fixture.
- `tests/rn-versions/0.81.6`: create as the RN `0.81.x` fixture.
- `tests/rn-versions/0.85.3`: create as the latest RN fixture.
- `tests/rn-versions/0.70.6`: remove from active fixture set.
- `README.md`: document RN `0.77+` active support and older versions as best effort.
- `src/index.js`: keep CLI options stable; this plan does not change the CLI option contract.
- `src/utils.js`: split responsibilities gradually, remove fragile async/file/git behavior.
- `src/paths.js`: keep platform rename rules here until a later split is proven by tests.

## Task 1: Stabilize Jest And Build Entry

**Files:**
- Modify: `jest.config.js`
- Modify: `package.json`

- [ ] **Step 1: Write the failing config expectation**

Add this temporary assertion to `tests/rename.test.js` near the top of the file so the current config failure is explicit before implementation:

```js
const jestConfig = require('../jest.config');

test('Jest disables Watchman for fixture tests', () => {
  expect(jestConfig.watchman).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npx jest tests/rename.test.js --runInBand --watchman=false
```

Expected: FAIL with `Expected: false` and `Received: undefined`.

- [ ] **Step 3: Update Jest config and scripts**

Change `jest.config.js` to:

```js
const config = {
  verbose: true,
  watchman: false,
  testPathIgnorePatterns: ['rn-versions', 'patches'],
};

module.exports = config;
```

Change the `scripts` section in `package.json` to include:

```json
{
  "test": "jest --runInBand",
  "pretest": "npm run build",
  "dev": "esbuild src/index.js --platform=node --bundle --outdir=lib --external:shelljs --watch",
  "build": "esbuild src/index.js --platform=node --bundle --outdir=lib --external:shelljs --minify --analyze",
  "prepublish": "npm run build",
  "relink": "npm unlink react-native-rename && npm run prepublish && npm link",
  "format": "prettier --write 'src/*.{js,jsx}' 'tests/**/*.js'",
  "lint": "eslint 'src/*.{js,jsx}' 'tests/**/*.js'"
}
```

- [ ] **Step 4: Run test to verify config passes**

Run:

```bash
npm test -- --testNamePattern="Jest disables Watchman"
```

Expected: PASS for the config assertion.

- [ ] **Step 5: Remove temporary assertion**

Delete the temporary `jestConfig` import and `Jest disables Watchman for fixture tests` test from `tests/rename.test.js`. The behavior is now covered by `npm test` running without the earlier Watchman crash.

- [ ] **Step 6: Commit**

```bash
git add jest.config.js package.json tests/rename.test.js
git commit -m "test: disable watchman for jest runs"
```

## Task 2: Add Temporary Fixture Harness

**Files:**
- Create: `tests/helpers/fixture.js`
- Modify: `tests/rename.test.js`

- [ ] **Step 1: Write a failing helper-based test**

Replace the contents of `tests/rename.test.js` with this single harness test:

```js
/* eslint-disable no-undef */
const fs = require('fs');
const path = require('path');
const {
  createFixtureProject,
  getStagedDiff,
  readFixtureFile,
  runRename,
} = require('./helpers/fixture');

describe('fixture harness', () => {
  test('runs rename in a temporary git project and keeps tracked fixture clean', () => {
    const project = createFixtureProject('0.77.1');

    runRename(project.cwd, '"Travel App"');

    const diff = getStagedDiff(project.cwd);
    expect(diff).toContain('rootProject.name = "Travel App"');
    expect(readFixtureFile(project.cwd, 'app.json')).toContain('"displayName": "Travel App"');
    expect(fs.existsSync(path.join(__dirname, 'rn-versions/0.77.1/ios/AwesomeProject'))).toBe(
      true
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand
```

Expected: FAIL with `Cannot find module './helpers/fixture'`.

- [ ] **Step 3: Create fixture helper**

Create `tests/helpers/fixture.js`:

```js
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../..');
const fixturesRoot = path.join(repoRoot, 'tests/rn-versions');
const cliPath = path.join(repoRoot, 'lib/index.js');

const run = (command, args, options = {}) => {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.stdio || 'pipe',
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(' ')}`,
        `Exit code: ${result.status}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join('\n')
    );
  }

  return result.stdout;
};

const initGit = cwd => {
  run('git', ['init'], { cwd });
  run('git', ['config', 'user.email', 'fixture@example.test'], { cwd });
  run('git', ['config', 'user.name', 'Fixture Test'], { cwd });
  run('git', ['config', 'core.autocrlf', 'false'], { cwd });
  run('git', ['config', 'core.safecrlf', 'false'], { cwd });
  run('git', ['add', '.'], { cwd });
  run('git', ['commit', '-m', 'fixture baseline'], { cwd });
};

const createFixtureProject = version => {
  const source = path.join(fixturesRoot, version);
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), `react-native-rename-${version}-`));
  const cwd = path.join(parent, 'project');

  fs.cpSync(source, cwd, {
    recursive: true,
    filter: sourcePath => !sourcePath.includes(`${path.sep}node_modules${path.sep}`),
  });
  initGit(cwd);

  return { cwd, parent, version };
};

const runRename = (cwd, args) => {
  run('node', [cliPath, ...args.match(/(?:[^\s"]+|"[^"]*")+/g).map(arg => arg.replace(/"/g, ''))], {
    cwd,
  });
};

const getStagedDiff = cwd => run('git', ['diff', '--cached', '--find-renames'], { cwd });

const getStagedNameStatus = cwd =>
  run('git', ['diff', '--cached', '--name-status', '--find-renames'], { cwd });

const readFixtureFile = (cwd, relativePath) => fs.readFileSync(path.join(cwd, relativePath), 'utf8');

module.exports = {
  createFixtureProject,
  getStagedDiff,
  getStagedNameStatus,
  readFixtureFile,
  runRename,
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- --runInBand
```

Expected: PASS for `fixture harness runs rename in a temporary git project and keeps tracked fixture clean`.

- [ ] **Step 5: Verify worktree is clean except intended files**

Run:

```bash
git status --short --untracked-files=all
```

Expected: only `tests/helpers/fixture.js` and `tests/rename.test.js` are changed.

- [ ] **Step 6: Commit**

```bash
git add tests/helpers/fixture.js tests/rename.test.js
git commit -m "test: run rename fixtures in temp projects"
```

## Task 3: Replace Snapshot Tests With Structured Matrix Assertions

**Files:**
- Modify: `tests/rename.test.js`
- Delete: `tests/__snapshots__/rename.test.js.snap`

- [ ] **Step 1: Replace tests with structured assertions for `0.77.1`**

Replace `tests/rename.test.js` with:

```js
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
  const androidStrings = readFixtureFile(
    cwd,
    'android/app/src/main/res/values/strings.xml'
  );
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
    expect(fs.existsSync(path.join(project.cwd, 'android/app/src/main/java/com/awesomeproject'))).toBe(
      true
    );
  });
});
```

- [ ] **Step 2: Run tests to verify assertions expose current behavior**

Run:

```bash
npm test -- --runInBand
```

Expected: PASS for `0.77.1`. If the test output shows a path string mismatch in the assertion itself, inspect the temp fixture output and update only the expected path or string in `tests/rename.test.js`; do not change CLI implementation in this task.

- [ ] **Step 3: Delete stale snapshot file**

Delete `tests/__snapshots__/rename.test.js.snap`.

- [ ] **Step 4: Run tests again**

Run:

```bash
npm test -- --runInBand
```

Expected: PASS and no snapshots used.

- [ ] **Step 5: Commit**

```bash
git add tests/rename.test.js tests/__snapshots__/rename.test.js.snap
git commit -m "test: assert fixture results without snapshots"
```

## Task 4: Refresh React Native Fixture Matrix

**Files:**
- Delete: `tests/rn-versions/0.70.6`
- Create: `tests/rn-versions/0.81.6`
- Create: `tests/rn-versions/0.85.3`
- Modify: `tests/rename.test.js`
- Create: `tests/rn-versions/README.md`

- [ ] **Step 1: Generate fresh RN fixtures outside the repo**

Run:

```bash
fixture_tmp=$(mktemp -d)
printf "%s" "$fixture_tmp" > /tmp/react-native-rename-fixture-dir
cd "$fixture_tmp"
npx @react-native-community/cli@latest init AwesomeProject081 --version 0.81.6 --skip-install
npx @react-native-community/cli@latest init AwesomeProject085 --version 0.85.3 --skip-install
```

Expected: two React Native projects generated in the temp directory. If the CLI asks for confirmation, answer yes.

- [ ] **Step 2: Copy fixtures into the repo**

Run from the repo root:

```bash
fixture_tmp=$(cat /tmp/react-native-rename-fixture-dir)
cp -R "$fixture_tmp/AwesomeProject081" tests/rn-versions/0.81.6
cp -R "$fixture_tmp/AwesomeProject085" tests/rn-versions/0.85.3
```

Expected: both fixture folders exist under `tests/rn-versions`.

- [ ] **Step 3: Remove generated dependency folders and lock-only noise if present**

Run:

```bash
rm -rf tests/rn-versions/0.81.6/node_modules tests/rn-versions/0.85.3/node_modules
rm -rf tests/rn-versions/0.81.6/ios/Pods tests/rn-versions/0.85.3/ios/Pods
```

Expected: fixtures keep source/native template files but not installed dependencies.

- [ ] **Step 4: Remove old active fixture**

Run:

```bash
git rm -r tests/rn-versions/0.70.6
```

Expected: `0.70.6` is staged for deletion.

- [ ] **Step 5: Document fixture generation**

Create `tests/rn-versions/README.md`:

```md
# React Native Fixture Versions

The active test matrix covers React Native `0.77+`:

- `0.77.1`
- `0.81.6`
- `0.85.3`

Generate fixtures from a temporary directory, then copy them into this folder:

```bash
npx @react-native-community/cli@latest init AwesomeProject081 --version 0.81.6 --skip-install
npx @react-native-community/cli@latest init AwesomeProject085 --version 0.85.3 --skip-install
```

Do not commit `node_modules` or CocoaPods install output.
```

- [ ] **Step 6: Keep active test matrix unchanged for this commit**

Confirm `tests/rename.test.js` still uses only the existing passing fixture:

```js
const activeVersions = ['0.77.1'];
```

- [ ] **Step 7: Run current fixture tests**

Run:

```bash
npm test -- --runInBand
```

Expected: tests pass for `0.77.1`; new fixtures are present but not active yet.

- [ ] **Step 8: Commit fixture file refresh**

```bash
git add tests/rn-versions tests/rename.test.js
git commit -m "test: add current react native fixtures"
```

## Task 5: Enable And Fix RN 0.81.6 And 0.85.3 Matrix

**Files:**
- Modify: `src/paths.js`
- Modify: `src/utils.js` when a failing fixture proves project detection needs a current-template update; otherwise leave it untouched.
- Modify: `tests/rename.test.js`

- [ ] **Step 1: Expand active version matrix**

Update `tests/rename.test.js`:

```js
const activeVersions = ['0.77.1', '0.81.6', '0.85.3'];
```

- [ ] **Step 2: Run matrix tests**

Run:

```bash
npm test -- --runInBand
```

Expected: FAIL if `0.81.6` or `0.85.3` has template paths or content patterns that current rename rules do not cover.

- [ ] **Step 3: Run targeted matrix test and capture first failure**

Run:

```bash
npm test -- --runInBand --testNamePattern="rn-versions/0.81.6"
```

Expected: either PASS or a focused failure showing the first unsupported RN template change.

- [ ] **Step 4: Add version-neutral assertion before code change**

If the failure is a missing expected file update, add an assertion that states the desired behavior. For example, if AppDelegate Swift module names are not updated, keep this assertion in `expectCommonRename`:

```js
const appDelegate = readFixtureFile(cwd, 'ios/TravelApp/AppDelegate.swift');
expect(appDelegate).toContain('moduleName = "Travel App"');
```

Run:

```bash
npm test -- --runInBand --testNamePattern="rn-versions/0.81.6"
```

Expected: FAIL until `src/paths.js` covers the template pattern.

- [ ] **Step 5: Update rename rules minimally**

Edit only the relevant option in `src/paths.js`. For Swift AppDelegate module name support, keep both existing patterns:

```js
{
  files: 'ios/*/AppDelegate.swift',
  from: [
    new RegExp(`self.moduleName = "${currentName}"`, 'g'),
    new RegExp(`moduleName = "${currentName}"`, 'g'),
    new RegExp(`withModuleName: "${currentName}"`, 'g'),
  ],
  to: [
    `self.moduleName = "${newName}"`,
    `moduleName = "${newName}"`,
    `withModuleName: "${newName}"`,
  ],
},
```

Apply the same pattern: add exact template patterns observed in `0.81.6` or `0.85.3`, avoid broad replacements that can rename unrelated user code.

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npm test -- --runInBand --testNamePattern="rn-versions/0.81.6"
npm test -- --runInBand --testNamePattern="rn-versions/0.85.3"
```

Expected: both fixture versions pass.

- [ ] **Step 7: Run full test suite**

Run:

```bash
npm test -- --runInBand
```

Expected: all matrix tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/paths.js src/utils.js tests/rename.test.js
git commit -m "fix: support current react native templates"
```

## Task 6: Update Dependencies In Controlled Groups

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Update low-risk runtime dependencies**

Run:

```bash
npm install chalk@^5.6.2 dotenv@^16.6.1 html-entities@^2.6.0
```

Expected: package files update.

- [ ] **Step 2: Verify**

Run:

```bash
npm run lint
npm test -- --runInBand
```

Expected: lint and tests pass.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: update low-risk runtime dependencies"
```

- [ ] **Step 4: Update test/build tooling**

Run:

```bash
npm install --save-dev esbuild@^0.28.0 jest@^30.4.2 eslint@^10.4.0 eslint-config-prettier@^10.1.8 eslint-plugin-prettier@^5.5.5 prettier@^3.8.3
```

Expected: package files update. If ESLint 10 requires flat config migration, continue with Step 5.

- [ ] **Step 5: Migrate lint config only if required**

If `npm run lint` fails because ESLint cannot find a flat config, create `eslint.config.js`:

```js
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
      },
    },
  },
  prettier,
];
```

- [ ] **Step 6: Verify**

Run:

```bash
npm run lint
npm run build
npm test -- --runInBand
```

Expected: lint, build, and tests pass.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json eslint.config.js
git commit -m "chore: update test and build tooling"
```

- [ ] **Step 8: Update remaining runtime dependencies one at a time**

Run each package update separately, verifying after each:

```bash
npm install cheerio@^1.2.0
npm run build
npm test -- --runInBand

npm install commander@^14.0.3
npm run build
npm test -- --runInBand

npm install globby@^16.2.0
npm run build
npm test -- --runInBand

npm install replace-in-file@^8.4.0
npm run build
npm test -- --runInBand
```

Expected: each package either passes or reveals an API incompatibility to handle before moving to the next package.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json src tests
git commit -m "chore: update remaining runtime dependencies"
```

## Task 7: Remove ShellJS From Tests

**Files:**
- Modify: `tests/helpers/fixture.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Verify test helper does not import shelljs**

Run:

```bash
rg "shelljs|shell\\.exec" tests
```

Expected: no results from `tests/helpers/fixture.js`. If `tests/rename.test.js` still imports `shelljs`, remove that import and use helper functions only.

- [ ] **Step 2: Remove test-time dependency on shelljs from package intent**

No package removal yet, because `src/utils.js` still uses `shelljs`. Keep `shelljs` in dependencies until Task 8.

- [ ] **Step 3: Verify**

Run:

```bash
npm test -- --runInBand
```

Expected: tests pass.

- [ ] **Step 4: Commit if edits were needed**

```bash
git add tests package.json package-lock.json
git commit -m "test: use native process helpers"
```

If no edits were needed, skip this commit.

## Task 8: Replace ShellJS In CLI Internals

**Files:**
- Modify: `src/utils.js`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add focused regression test for git staging**

Add this test inside the existing `describe.each(activeVersions)` block in `tests/rename.test.js`:

```js
test('stages rename changes after a successful run', () => {
  const project = createFixtureProject(version);

  runRename(project.cwd, '"Travel App"');

  expect(getStagedNameStatus(project.cwd)).toContain('M');
  expect(getStagedNameStatus(project.cwd)).toContain('TravelApp');
});
```

- [ ] **Step 2: Run test before refactor**

Run:

```bash
npm test -- --runInBand --testNamePattern="stages rename changes"
```

Expected: PASS before refactor, proving current behavior.

- [ ] **Step 3: Replace shell command helpers in `src/utils.js`**

At the top of `src/utils.js`, replace:

```js
import shell from 'shelljs';
```

with:

```js
import childProcess from 'child_process';
```

Add this helper near the constants:

```js
const runCommand = (command, args, options = {}) => {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || APP_PATH,
    encoding: 'utf8',
    stdio: options.silent ? 'pipe' : 'inherit',
  });

  return {
    code: result.status,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
};
```

Update git helpers:

```js
export const validateGitRepo = () => {
  const isGitRepository = runCommand('git', ['rev-parse', '--is-inside-work-tree'], {
    silent: true,
  }).code === 0;

  if (!isGitRepository) {
    console.log('This is not a git repository');
    process.exit();
  }
};

export const checkGitRepoStatus = () => {
  const output = runCommand('git', ['status', '--porcelain'], { silent: true }).stdout;
  const isClean = output === '';

  if (!isClean) {
    console.log(
      `The directory is not clean. There are changes that have not been committed to the Git repository.
Clean it first and try again or use "--skipGitStatusCheck" option to skip this check.`
    );
    process.exit();
  }
};

export const gitStageChanges = () => {
  runCommand('git', ['config', '--local', 'core.autocrlf', 'false']);
  runCommand('git', ['config', '--local', 'core.safecrlf', 'false']);
  runCommand('git', ['add', '.']);
};
```

- [ ] **Step 4: Replace file move and remove operations**

In `renameFoldersAndFiles`, replace the `shell.mv` block with native `fs` operations:

```js
if (createNewPathFirst) {
  fs.mkdirSync(newPath, { recursive: true });
}

if (!fs.existsSync(currentPath)) {
  return;
}

if (shellMoveCurrentPathGlobEnd === '/*') {
  fs.mkdirSync(newPath, { recursive: true });
  for (const entry of fs.readdirSync(currentPath)) {
    fs.renameSync(path.join(currentPath, entry), path.join(newPath, entry));
  }
  fs.rmSync(currentPath, { recursive: true, force: true });
} else {
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.renameSync(currentPath, newPath);
}

console.log(toRelativePath(newPath), chalk.green('RENAMED'));
```

In `cleanBuilds`, replace the `shell.rm` call with:

```js
export const cleanBuilds = () => {
  buildPaths.forEach(buildPath => {
    globbySync(normalizePath(path.join(APP_PATH, buildPath))).forEach(match => {
      fs.rmSync(match, { recursive: true, force: true });
    });
  });
  console.log(chalk.yellow('Done removing builds.'));
};
```

- [ ] **Step 5: Remove shelljs dependency**

Run:

```bash
npm uninstall shelljs
```

Update build scripts in `package.json` to remove the external:

```json
{
  "dev": "esbuild src/index.js --platform=node --bundle --outdir=lib --watch",
  "build": "esbuild src/index.js --platform=node --bundle --outdir=lib --minify --analyze"
}
```

- [ ] **Step 6: Verify**

Run:

```bash
npm run lint
npm run build
npm test -- --runInBand
npm audit --audit-level=high
```

Expected: lint, build, tests pass; high-severity audit count is reduced compared with the pre-plan audit.

- [ ] **Step 7: Commit**

```bash
git add src/utils.js package.json package-lock.json tests/rename.test.js
git commit -m "refactor: replace shelljs with native node APIs"
```

## Task 9: Document Support Policy

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add support policy section**

Add this section after the intro note in `README.md`:

```md
### React Native version support

The actively tested support window is React Native `0.77+`.

This package is tested against React Native `0.77.1`, `0.81.6`, and `0.85.3`. Older React Native versions may still work, but they are best effort and are not part of the active test matrix. If you need support for an older version, please open an issue with a reproducible fixture or sample project.
```

- [ ] **Step 2: Verify README references**

Run:

```bash
rg "0\\.70|0\\.77|0\\.81|0\\.85|React Native version support" README.md tests/rn-versions/README.md
```

Expected: README mentions `0.77.1`, `0.81.6`, and `0.85.3`; no README language promises active `0.70` support.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document react native support policy"
```

## Task 10: Final Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm run lint
npm run build
npm test -- --runInBand
npm audit --audit-level=high
git status --short
```

Expected:

- `npm run lint` passes.
- `npm run build` passes.
- `npm test -- --runInBand` passes for `0.77.1`, `0.81.6`, and `0.85.3`.
- `npm audit --audit-level=high` exits with code `0`, or any remaining high finding is documented with the package path and reason it cannot be removed in this pass.
- `git status --short` is clean.

- [ ] **Step 2: Produce completion summary**

Summarize:

- Fixture matrix changed from `0.70.6`/`0.77.1` to `0.77.1`/`0.81.6`/`0.85.3`.
- Tests now run against temp fixture copies and leave tracked fixtures clean.
- Dependencies updated or removed.
- Support policy documented.
- Remaining risks or follow-up issues.
