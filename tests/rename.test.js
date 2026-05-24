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
