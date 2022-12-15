// .option(
//   '-a, --alphanumericName [value]',
//   'alphanumeric name that can be used in replacing files, folders and content eg. "TravelApp"'
// )

// export const validateAlphanumericName = name => {
//   const alphanumericName = clearName(name);
//   if (alphanumericName.length < MIN_ALPHANUMERIC_NAME_LENGTH) {
//     console.log('Please provide an name with at least 2 alphanumeric characters');
//     process.exit();
//   }
// };

// export const getIosXcodeProjectPathName = () => {
//   const xcodeProjectPath = globbySync(path.join(APP_PATH, 'ios/*.xcodeproj'), {
//     onlyDirectories: true,
//   });
//   // Get the name of the xcode project
//   const xcodeProjectName = xcodeProjectPath[0].split('/').pop().replace('.xcodeproj', '');
//   return xcodeProjectName;
// };
