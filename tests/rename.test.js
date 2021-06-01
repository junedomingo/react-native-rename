

const shell = require('shelljs');
const path = require('path');
const fs = require('fs');

const run = (cwd, args) => {
  shell.exec(`node ../../../lib/index.js ${args}`, {
    cwd,
    silent: true
  });
}

const getDiff = (cwd) => {
  const diff = shell.exec(`git diff --staged`, {
    cwd,
    silent: true
  });

  return diff.stdout;
}

const getExpected = (name) => {
  return fs.readFileSync(path.join(__dirname, `./patches/${name}`)).toString()
}

const resetGit = (cwd) => {
  shell.exec(`git reset -q HEAD -- .`, {
    cwd,
    silent: true
  });
  shell.exec(`git clean -f -q -- .`, {
    cwd,
    silent: true
  });
  shell.exec(`git checkout -q -- .`, {
    cwd,
    silent: true
  });
}

describe('rn-versions/0.64', () => {
  const cwd = path.join(__dirname, 'rn-versions/0.64');

  afterEach(() => {
    resetGit(cwd);
  });

  test('change bundle id', () => {
    run(cwd, `-b "com.test64.app"`);

    const expected = getExpected('rename-bundle-id-simple.patch');

    const actual = getDiff(cwd);

    expect(actual).toBe(expected);
  })
});
