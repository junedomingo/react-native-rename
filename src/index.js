#!/usr/bin/env node

// nS - No Space
// lC - Lowercase

import cheerio from 'cheerio';
import colors from 'colors';
import fs from 'fs';
import mv from 'mv';
import name from 'project-name';
import pathExists from 'path-exists';
import program from 'commander';
import replace from 'replace';
import {foldersAndFiles} from './config/foldersAndFiles';
import {filesToModifyContent} from './config/filesToModifyContent';
import childProcess from 'child_process';

const projectName = name();
const replaceOptions = {
	recursive: true,
	silent: true
};

function readFile(filePath) {
	return new Promise((resolve, reject) => {
		fs.readFile(filePath, (err, data) => {
			if (err) { reject(err); }
			resolve(data);
		});
	});
}

function replaceContent(regex, replacement, paths) {
	replace({
		regex,
		replacement,
		paths,
		...replaceOptions
	});

	for (const path of paths) {
		console.log(`${path} ${colors.green('MODIFIED')}`);
	}
}

readFile('./android/app/src/main/res/values/strings.xml')
	.then(data => {
		const $ = cheerio.load(data);
		const currentAppName = $('string[name=app_name]').text();
		const nS_CurrentAppName = currentAppName.replace(/\s/g, '');
		const lC_Ns_CurrentAppName = nS_CurrentAppName.toLowerCase();

		program
			.version('2.0.1')
			.arguments('<newName>')
			.action(newName => {
				const nS_NewName = newName.replace(/\s/g, '');
				const pattern = /^([0-9]|[a-z])+([0-9a-z\s]+)$/i;

				if (!pattern.test(newName)) {
					return console.log(`"${newName}" is not a valid name for a project. Please use a valid identifier name (alphanumeric and space).`);
				}

				if (newName === currentAppName
					|| newName === nS_CurrentAppName
					|| newName === lC_Ns_CurrentAppName) {
					return console.log(`Please try a different name.`);
				}

				// Clean builds on both platform
				let builds = [
					`rm -rf ./ios/build`,
					`rm -rf ./android/.gradle`,
					`rm -rf ./android/app/build`,
					`rm -rf ./android/build`
				];

				builds = builds.toString().replace(/,/g, ' && ');

				childProcess.exec(builds, (error, stdout) => {
					if (error !== null) console.log(error);
				});

				foldersAndFiles(currentAppName, newName)
					.map((element, index) => {
						const dest = element.replace(new RegExp(nS_CurrentAppName, 'gi'), nS_NewName);
						pathExists(element)
							.then(exists => {
								setTimeout(() => {
									if (exists) {
										// android
										if (index === 8) {
											mv(element, dest.toLowerCase(), err => {
												if (err) return console.log('Error in renaming Adroid folder.', err);
												console.log(`${dest.toLowerCase()} ${colors.green('RENAMED')}`);
											});
											return;
										}
										mv(element, dest, err => {
											if (err) return console.log('Error in renaming folder.', err);
											console.log(`${dest} ${colors.green('RENAMED')}`);
										});
									} else {
										// Rename childdren file
										mv(element, dest, err => {
											if (err) return;
											console.log(`${dest} ${colors.green('RENAMED')}`);
										});
									}
								}, 600*index);
							});
					});

				setTimeout(() => {
					filesToModifyContent(currentAppName, newName, projectName).map(file => {
						file.paths.map((path, index) => {
							const newPaths = [];
							pathExists(path)
								.then(exists => {
									if (exists) {
										newPaths.push(path);
										setTimeout(() => {
											replaceContent(file.regex, file.replacement, newPaths);
										}, 500*index);
									}
								});
						});
					});
				}, 8000);

			}).parse(process.argv);
		if (!process.argv.slice(2).length) program.outputHelp();
	})
	.catch(err => {
		if (err.code === 'ENOENT') return console.log('Directory should be created using "react-native init"');
		return console.log('Something went wrong: ', err.code);
	});
