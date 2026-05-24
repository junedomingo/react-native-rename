# React Native Fixture Versions

The active test matrix covers React Native `0.77+`:

- `0.77.1`
- `0.81.6`
- `0.85.3`

Generate fixtures from a temporary directory, then copy them into this folder:

```bash
npx @react-native-community/cli@latest init AwesomeProject081 --version 0.81.6 --skip-install
npx @react-native-community/cli@latest init AwesomeProject085 --version 0.85.3 --skip-install
```

Do not commit `node_modules` or CocoaPods install output.
