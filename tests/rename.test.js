

const shell = require('shelljs');
const path = require('path');

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

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('change app name', () => {
    run(cwd, `"New Test App"`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });

  test('change app name and bundle id', () => {
    run(cwd, `"New Test App" -b "com.test64.app"`);

    const result = getDiff(cwd);

    expect(result).toMatchSnapshot();
  });
});
