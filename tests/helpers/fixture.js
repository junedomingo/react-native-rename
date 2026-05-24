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
