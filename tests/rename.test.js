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

expect.addSnapshotSerializer({
  test: val => typeof val === 'string',
  print: val => val.replace(/\r\n/g, '\n').replace(/\\/g, '/'),
});

describe('rn-versions/0.77.1', () => {
  const cwd = path.join(__dirname, 'rn-versions/0.77.1');

  afterEach(() => {
    resetGit(cwd);
  });

  test('Change app name', () => {
    run(cwd, `"Travel App"`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for both ios and android', () => {
    run(cwd, `"Travel App" -b com.example.travelapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for android only', () => {
    run(cwd, `"Travel App" --androidBundleID com.example.travelapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('Change app name and bundle id for ios only', () => {
    run(cwd, `"Travel App" --iosBundleID com.example.travelapp`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });
});
