#!/usr/bin/env node --harmony
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
import cheerio from 'cheerio';
import childProcess from 'child_process';
import fileExists from 'file-exists';
import fs from 'fs';
import name from 'project-name';
import program from 'commander';
import replace from 'replace';

let projectName = name();

projectName = projectName.replace(/\s/g, '');

const replaceOptions = {
	recursive: true,
	silent: true
};

fs.readFile('./android/app/src/main/res/values/strings.xml', 'utf8', (err, markup) => {
	if (err) return console.log(err);

	const $ = cheerio.load(markup);
	const appName = $('string[name=app_name]').text();

	program
		.version('1.0.4')
		.arguments('<currentProjectName> <newName>')
		.action((currentProjectName, newName) => {
			if (currentProjectName !== projectName) {
				return console.log(`Project name didn't match!, your current project name is "${projectName}" `);
			}

			if (newName.replace(/\s/g, '') === projectName) {
				return console.log(`Please try different name.`);
			}

			const withSpaceNewName = newName;
			newName = newName.replace(/\s/g, '');
			const lowercaseCurrentProjectName = currentProjectName.toLowerCase();
			const lowercaseNewName = newName.toLowerCase();
			const pattern = /^([0-9]|[a-z])+([0-9a-z\s]+)$/i;

			if (!pattern.test(newName)) {
				return console.log(`"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`);
			}

			// Android App name
			replace({
				regex: `<string name="app_name">${appName}</string>`,
				replacement: `<string name="app_name">${withSpaceNewName}</string>`,
				paths: [`./android/app/src/main/res/values/strings.xml`],
				...replaceOptions
			});

			const iosPlistFiles = [
				`./ios/${currentProjectName}/Info.plist`,
				`./ios/${currentProjectName}Tests/Info.plist`
			];

			// iOs App name
			for (const file of iosPlistFiles) {
				fs.readFile(file, 'utf8', (err, data) => {
				    if (err) return console.log(err);

				    const result = data.replace('<string>$(PRODUCT_NAME)</string>', `<string>${withSpaceNewName}</string>`);
				    fs.writeFile(file, result, 'utf8', (err) => {
				        if (err) return console.log(err);
				    });
				});
			}

			replace({
				regex: `<string>${appName}</string>`,
				replacement: `<string>${withSpaceNewName}</string>`,
				paths: [
					`./ios/${currentProjectName}/Info.plist`,
					`./ios/${currentProjectName}Tests/Info.plist`
				],
				...replaceOptions
			});

			replace({
				regex: currentProjectName,
				replacement: withSpaceNewName,
				paths: [`./ios/${currentProjectName}/Base.lproj/LaunchScreen.xib`],
				...replaceOptions
			});

			replace({
				regex: appName,
				replacement: withSpaceNewName,
				paths: [`./ios/${currentProjectName}/Base.lproj/LaunchScreen.xib`],
				...replaceOptions
			});

			// Lowercase strings
			replace({
				regex: lowercaseCurrentProjectName,
				replacement: lowercaseNewName,
				paths: [
					`./android/app/BUCK`,
					`./android/app/build.gradle`,
					`./android/app/src/main/AndroidManifest.xml`,
					`./android/app/src/main/java/com/${lowercaseCurrentProjectName}/MainActivity.java`
				],
				...replaceOptions
			});

			if (fileExists(`./android/app/src/main/java/com/${lowercaseCurrentProjectName}/MainApplication.java`)) {
				replace({
					regex: lowercaseCurrentProjectName,
					replacement: lowercaseNewName,
					paths: [`./android/app/src/main/java/com/${lowercaseCurrentProjectName}/MainApplication.java`],
					...replaceOptions
				});
			}

			replace({
				regex: currentProjectName,
				replacement: newName,
				paths: [
					`./package.json`,
					`./index.ios.js`,
					`./ios/${currentProjectName}/AppDelegate.m`,
					`./ios/${currentProjectName}.xcodeproj/xcshareddata/xcschemes/${currentProjectName}.xcscheme`,
					`./ios/${currentProjectName}.xcodeproj/project.pbxproj`,
					`./ios/${currentProjectName}Tests/${currentProjectName}Tests.m`,
					`./index.android.js`,
					`./android/app/src/main/java/com/${lowercaseCurrentProjectName}/MainActivity.java`,
					`./android/settings.gradle`
				],
				...replaceOptions
			});

			let commands = [
				`mv ./ios/${currentProjectName} ios/${newName}`,
				`mv ./ios/${currentProjectName}.xcodeproj/xcshareddata/xcschemes/${currentProjectName}.xcscheme ios/${currentProjectName}.xcodeproj/xcshareddata/xcschemes/${newName}.xcscheme`,
				`mv ./ios/${currentProjectName}.xcodeproj ios/${newName}.xcodeproj`,
				`mv ./ios/${currentProjectName}Tests/${currentProjectName}Tests.m ios/${currentProjectName}Tests/${newName}Tests.m`,
				`mv ./ios/${currentProjectName}Tests ios/${newName}Tests`,
				`mv ./android/app/src/main/java/com/${lowercaseCurrentProjectName} android/app/src/main/java/com/${lowercaseNewName}`,
				`rm -rf ./ios/${currentProjectName}`,
				`rm -rf ./ios/${currentProjectName}.xcodeproj/xcshareddata/xcschemes/${currentProjectName}.xcscheme`,
				`rm -rf ./ios/${currentProjectName}.xcodeproj`,
				`rm -rf ./ios/${currentProjectName}Tests/${currentProjectName}Tests.m`,
				`rm -rf ./ios/${currentProjectName}Tests`,
				`rm -rf ./android/app/src/main/java/com/${lowercaseCurrentProjectName}`,
				`rm -rf ./ios/build`,
				`rm -rf ./android/.gradle`,
				`rm -rf ./android/app/build`,
				`rm -rf ./android/build`
			];

			commands = commands.toString().replace(/,/g, ' && ');

			setTimeout(function () {
				childProcess.exec(commands, (error, stdout) => {
					if (error !== null) console.log(`exec error: ${error}`);
					console.log(`App successfully renamed to "${withSpaceNewName}"`);
				});
			}, 1000);
		})
		.parse(process.argv);

	if (!process.argv.slice(2).length) program.outputHelp();
});
