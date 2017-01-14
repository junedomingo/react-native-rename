#!/usr/bin/env node

import cheerio from 'cheerio';
import childProcess from 'child_process';
import fileExists from 'file-exists';
import fs from 'fs';
import name from 'project-name';
import outdent from 'outdent';
import program from 'commander';
import replace from 'replace';

const projectName = name();

const replaceOptions = {
	recursive: true,
	silent: true
};

fs.readFile('./android/app/src/main/res/values/strings.xml', 'utf8', (err, markup) => {

	if (err === null) {
		const $ = cheerio.load(markup);
		const currentAppName = $('string[name=app_name]').text();
		const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
		const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase();

		program
			.version('1.0.9')
			.arguments('<newName>')
			.action((newName) => {

				const nS_NewName = newName.replace(/\s/g, '');
				const lC_Ns_NewName = nS_NewName.toLowerCase();
				const pattern = /^([0-9]|[a-z])+([0-9a-z\s]+)$/i;

				// Check if entered new name is valid based on regex pattern
				if (!pattern.test(newName)) {
					return console.log(`"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`);
				}

				if (newName === currentAppName || newName === nS_CurrentAppName || newName === lC_Ns_CurrentAppName) {
					return console.log(`Please try a different name.`);
				}

				// Rename all folders
				let commands = [
					`mv ./ios/${nS_CurrentAppName} ios/${nS_NewName}`,
					`mv ./ios/${nS_CurrentAppName}.xcodeproj/xcshareddata/xcschemes/${nS_CurrentAppName}.xcscheme ios/${nS_CurrentAppName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}.xcscheme`,
					`mv ./ios/${nS_CurrentAppName}.xcodeproj ios/${nS_NewName}.xcodeproj`,
					`mv ./ios/${nS_CurrentAppName}Tests/${nS_CurrentAppName}Tests.m ios/${nS_CurrentAppName}Tests/${nS_NewName}Tests.m`,
					`mv ./ios/${nS_CurrentAppName}Tests ios/${nS_NewName}Tests`,
					`mv ./android/app/src/main/java/com/${lC_Ns_CurrentAppName} android/app/src/main/java/com/${lC_Ns_NewName}`,
					`rm -rf ./ios/${nS_CurrentAppName}`,
					`rm -rf ./ios/${nS_CurrentAppName}.xcodeproj/xcshareddata/xcschemes/${nS_CurrentAppName}.xcscheme`,
					`rm -rf ./ios/${nS_CurrentAppName}.xcodeproj`,
					`rm -rf ./ios/${nS_CurrentAppName}Tests/${nS_CurrentAppName}Tests.m`,
					`rm -rf ./ios/${nS_CurrentAppName}Tests`,
					`rm -rf ./android/app/src/main/java/com/${lC_Ns_CurrentAppName}`,
					`rm -rf ./ios/build`,
					`rm -rf ./android/.gradle`,
					`rm -rf ./android/app/build`,
					`rm -rf ./android/build`
				];

				commands = commands.toString().replace(/,/g, ' && ');

				childProcess.exec(commands, (error, stdout) => {
					if (error !== null) {
						console.log(outdent`
							The app_name value in ./android/app/src/main/res/values/strings.xml must be the same with ./ios/AppFolderName before renaming the app.
							ex. ./ios/CoolApp  --->  <string name="app_name">CoolApp</string>
							and try running the command again with you new app name.
							ex. react-native-rename "Awesome App"
							If your're using Windows OS, please run this command using Git Bash or Cygwin or other equivalent that runs Linux commands.
						`);
						process.exit(1);
					}
				});

				setTimeout(function () {
					// Replace android display name
					replace({
						regex: `<string name="app_name">${currentAppName}</string>`,
						replacement: `<string name="app_name">${newName}</string>`,
						paths: [
							`./android/app/src/main/res/values/strings.xml`
						],
						...replaceOptions
					});

					// Replace ios display name
					renameIosPlist(nS_NewName, newName);

					// Replace LaunchScreen text for the first time
					replace({
						regex: `text="${nS_CurrentAppName}"`,
						replacement: `text="${newName}"`,
						paths: [
							`./ios/${nS_NewName}/Base.lproj/LaunchScreen.xib`
						],
						...replaceOptions
					});

					// Replace LaunchScreen text
					replace({
						regex: `text="${currentAppName}"`,
						replacement: `text="${newName}"`,
						paths: [
							`./ios/${nS_NewName}/Base.lproj/LaunchScreen.xib`
						],
						...replaceOptions
					});

					// Replace text based on newName w/o the spaces and in lowercase
					replace({
						regex: lC_Ns_CurrentAppName,
						replacement: lC_Ns_NewName,
						paths: [
							`./android/app/build.gradle`,
							`./android/app/src/main/AndroidManifest.xml`,
							`./android/app/src/main/java/com/${lC_Ns_NewName}/MainActivity.java`
						],
						...replaceOptions
					});

					// Check if BUCK exists, because some project don't have this file
					if (fileExists(`./android/app/BUCK`)) {
						replace({
							regex: lC_Ns_CurrentAppName,
							replacement: lC_Ns_NewName,
							paths: [
								`./android/app/BUCK`
							],
							...replaceOptions
						});
					}

					// Check if MainApplication.java exists, because some project don't have this file
					if (fileExists(`./android/app/src/main/java/com/${lC_Ns_NewName}/MainApplication.java`)) {
						replace({
							regex: lC_Ns_CurrentAppName,
							replacement: lC_Ns_NewName,
							paths: [
								`./android/app/src/main/java/com/${lC_Ns_NewName}/MainApplication.java`
							],
							...replaceOptions
						});
					}

					// Replace text based on newName w/o the spaces
					replace({
						regex: nS_CurrentAppName,
						replacement: nS_NewName,
						paths: [
							`./index.ios.js`,
							`./ios/${nS_NewName}/AppDelegate.m`,
							`./ios/${nS_NewName}.xcodeproj/xcshareddata/xcschemes/${nS_NewName}.xcscheme`,
							`./ios/${nS_NewName}.xcodeproj/project.pbxproj`,
							`./ios/${nS_NewName}Tests/${nS_NewName}Tests.m`,
							`./index.android.js`,
							`./android/app/src/main/java/com/${lC_Ns_NewName}/MainActivity.java`,
							`./android/settings.gradle`
						],
						...replaceOptions
					});

					// Replace package.json name property
					replace({
						regex: projectName,
						replacement: nS_NewName,
						paths: [
							`./package.json`
						],
						...replaceOptions
					});

					console.log(`App successfully renamed to "${newName}"`);

				}, 5000);

			})
			.parse(process.argv);

		if (!process.argv.slice(2).length) program.outputHelp();

	} else if (err.code === 'ENOENT') {
		return console.log('Directory should be created using "react-native init"');
	} else {
		return console.log('Something went wrong: ', err.code);
	}

});

function renameIosPlist(nS_NewName, newName) {
	fs.readFile(`./ios/${nS_NewName}/Info.plist`, 'utf8', (err, markup) => {
		const $ = cheerio.load(markup);
		const CFBundleName = $("key:contains('CFBundleName')").next().text();
		const iosPlistFiles = [
			`./ios/${nS_NewName}/Info.plist`,
			`./ios/${nS_NewName}Tests/Info.plist`
		];

		for (const file of iosPlistFiles) {
			fs.readFile(file, 'utf8', (err, data) => {
				if (err) return console.log(err);

				const result = data.replace(CFBundleName, newName);
				fs.writeFile(file, result, 'utf8', (err) => {
					if (err) return console.log(err);
				});
			});
		}
	});
}
