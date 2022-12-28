# react-native-rename

[![NPM version](https://img.shields.io/npm/v/react-native-rename.svg?style=flat)](https://www.npmjs.com/package/react-native-rename) [![NPM monthly downloads](https://img.shields.io/npm/dm/react-native-rename.svg?style=flat)](https://npm-stat.com/charts.html?package=react-native-rename) [![Paypal Donate](https://img.shields.io/badge/paypal-donate-green.svg?style=flat)](https://www.paypal.me/junedomingo)

Rename react-native app with just one command

![react-native-rename](https://cloud.githubusercontent.com/assets/5106887/24444940/cbcb0a58-149a-11e7-9714-2c7bf5254b0d.gif)

> This package assumes that you created your react-native project using `react-native init`.

**Note:** This package does not attempt to properly rename build artifacts such as `ios/build` or Cocoa Pod installation targets. After renaming your project you should clean, build, and reinstall third party dependencies to get it running properly with the new name.

### Usage
```
$ npx react-native-rename "new_name"
```

> With custom Bundle Identifier
```
$ npx react-native-rename "new_name" -b "bundle_identifier"
```

### Example

##### First, Switch to new branch (optional but recommended)
```
$ git checkout -b rename-app
```
##### Then, Rename your app
```
$ npx react-native-rename "Travel App"
```
With custom Bundle Identifier
```
$ npx react-native-rename "Travel App" -b "com.junedomingo.travelapp"
```

### CLI Options
|            Name            | Description                                                                                                                                  |
| :------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `-b` or `--bundleID` [value] | Set custom bundle identifier for both ios and android eg. "com.example.app" or "com.example". |
| `--iosBundleID` [value] | Set custom bundle identifier specifically for ios. |
| `--androidBundleID` [value] | Set custom bundle identifier specifically for android. |
| `-p` or `--pathContentStr` [value] | Path and content string that can be used in replacing folders, files and their content. Make sure it doesn't include any special characters. |
|   `--skipGitStatusCheck`   | Skip git repo status check                                                                                                                   |

### Local installation
With **Yarn**:
```
$ yarn global add react-native-rename
```
With **npm**:
```
$ npm install react-native-rename -g
```

### Support
<a href="https://www.buymeacoffee.com/junedomingo"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=junedomingo&button_colour=FFDD00&font_colour=000000&font_family=Bree&outline_colour=000000&coffee_colour=ffffff" /></a>
