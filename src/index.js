#!/usr/bin/env node --harmony
/* eslint-disable no-console */
const childProcess = require('child_process');
const name = require('project-name');
const program = require('commander');
const replace = require("replace");

const projectName = name();

program
	.version('1.0.3')
	.arguments('<currentName> <newName>')
	.action((currentName, newName) => {
		if (currentName !== projectName) return console.log("App name didn't match");

		const lowercaseCurrentName = currentName.toLowerCase();
		const lowercaseNewName = newName.toLowerCase();
		const pattern = /^([0-9]|[a-z])+([0-9a-z]+)$/i;

		if (!pattern.test(newName)) {
			return console.log(`${newName} is not a valid name for a project. Please use a valid identifier name (alphanumeric).`);
		}

		replace({
			regex: currentName,
			replacement: newName,
			paths: [
				`./package.json`,
				`./index.ios.js`,
				`./ios/${currentName}/Base.lproj/LaunchScreen.xib`,
				`./ios/${currentName}/AppDelegate.m`,
				`./ios/${currentName}.xcodeproj/xcshareddata/xcschemes/${currentName}.xcscheme`,
				`./ios/${currentName}.xcodeproj/project.pbxproj`,
				`./ios/${currentName}Tests/${currentName}Tests.m`,
				`./index.android.js`,
				`./android/app/src/main/java/com/${lowercaseCurrentName}/MainActivity.java`,
				`./android/app/src/main/res/values/strings.xml`,
				`./android/settings.gradle`
			],
			recursive: true,
			silent: true
		});

		// Lowercase strings
		replace({
			regex: lowercaseCurrentName,
			replacement: lowercaseNewName,
			paths: [
				`./android/app/BUCK`,
				`./android/app/build.gradle`,
				`./android/app/src/main/AndroidManifest.xml`,
				`./android/app/src/main/java/com/${lowercaseCurrentName}/MainActivity.java`,
				`./android/app/src/main/java/com/${lowercaseCurrentName}/MainApplication.java`
			],
			recursive: true,
			silent: true
		});

		let commands = [
			`mv ios/${currentName} ios/${newName}`,
			`mv ios/${currentName}.xcodeproj/xcshareddata/xcschemes/${currentName}.xcscheme ios/${currentName}.xcodeproj/xcshareddata/xcschemes/${newName}.xcscheme`,
			`mv ios/${currentName}.xcodeproj ios/${newName}.xcodeproj`,
			`mv ios/${currentName}Tests/${currentName}Tests.m ios/${currentName}Tests/${newName}Tests.m`,
			`mv ios/${currentName}Tests ios/${newName}Tests`,
			`mv android/app/src/main/java/com/${lowercaseCurrentName} android/app/src/main/java/com/${lowercaseNewName}`,
			`rm -rf ios/build`,
			`rm -rf android/.gradle`,
			`rm -rf android/app/build`,
			`rm -rf android/build`
		];

		commands = commands.toString().replace(/,/g, ' && ');

		childProcess.exec(commands, (error, stdout) => {
			if (error !== null) console.log(`exec error: ${error}`);
			console.log(`App successfully renamed to ${newName}`);
		});
	})
	.parse(process.argv);

if (!process.argv.slice(2).length) program.outputHelp();