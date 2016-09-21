#!/usr/bin/env node --harmony
/* eslint-disable no-console */
const childProcess = require('child_process');
const name = require('project-name');
const program = require('commander');
const replace = require("replace");

const projectName = name();

program
	.version('1.0.0')
	.arguments('<currentName> <newName>')
	.action((currentName, newName) => {
		if (currentName !== projectName) return console.log("App name didn't match");

		const lowercaseCurrentName = currentName.toLowerCase();
		const pattern = /^([0-9]|[a-z])+([0-9a-z]+)$/i;

		if (!pattern.test(newName)) {
			return console.log(`${newName} is not a valid name for a project. Please use a valid identifier name (alphanumeric).`);
		}

		replace({
			regex: currentName,
			replacement: newName,
			paths: [
				'./index.ios.js',
				'./index.android.js',
				'./android/settings.gradle',
				'./android/app/src/main/res/values/strings.xml',
				'./package.json'
			],
			recursive: true,
			silent: true
		});

		// Lowercase strings
		replace({
			regex: currentName.toLowerCase(),
			replacement: newName.toLowerCase(),
			paths: [
				'./android/app/BUCK',
				'./android/app/build.gradle',
				'./android/app/src/main/AndroidManifest.xml'
			],
			recursive: true,
			silent: true
		});

		// Delete folders
		let foldersToDelete = [
			`ios/build`,
			`ios/${currentName}`,
			`ios/${currentName}.xcodeproj`,
			`ios/${currentName}Tests`,
			`android/app/src/main/java/com/${lowercaseCurrentName}`
		];

		foldersToDelete = foldersToDelete.toString().replace(/,/g, ' ');

		childProcess.exec(`rm -rf ${foldersToDelete}`, (error, stdout) => {
			if (error !== null) console.log(`exec error: ${error}`);
		});

		// Upgrade app
		childProcess.exec('react-native upgrade', (error, stdout) => {
			if (error !== null) console.log(`exec error: ${error}`);
			console.log(`App successfully renamed to ${newName}`);
		});
	})
	.parse(process.argv);

if (!process.argv.slice(2).length) program.outputHelp();