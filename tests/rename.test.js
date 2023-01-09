/* eslint-disable no-undef */
const shell = require('shelljs');
const path = require('path');

const run = (cwd, args) => {
  shell.exec(`node ../../../lib/index.js ${args}`, {
    cwd,
    silent: true,
  });
};

const getDiff = cwd => {
  const diff = shell.exec(`git diff --staged`, {
    cwd,
    silent: true,
  });

  return diff.stdout;
};

const resetGit = cwd => {
  shell.exec(`git reset -q HEAD -- .`, {
    cwd,
    silent: true,
  });
  shell.exec(`git clean -f -q -- .`, {
    cwd,
    silent: true,
  });
  shell.exec(`git checkout -q -- .`, {
    cwd,
    silent: true,
  });
};

describe('rn-versions/0.70.6', () => {
  const cwd = path.join(__dirname, 'rn-versions/0.70.6');

  afterEach(() => {
    resetGit(cwd);
  });

  test('Change app name', () => {
    run(cwd, `"Demo App"`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for both ios and android', () => {
    run(cwd, `"Demo App" -b com.example.demoapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for android only', () => {
    run(cwd, `"Demo App" --androidBundleID com.example.demoapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for ios only', () => {
    run(cwd, `"Demo App" --iosBundleID com.example.demoapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });
});
