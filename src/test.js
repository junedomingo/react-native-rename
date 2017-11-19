var shell = require('shelljs');

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
} else {
  if (shell.exec('git mv src/moveme.js src/hello').code !== 0) {
    shell.echo('Error: Git commit failed');
    shell.exit(1);
  }
}
