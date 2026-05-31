# React Native Rename Modernization Design

## Context

`react-native-rename` is a small Node CLI that renames React Native app names, iOS project paths, Android package paths, bundle identifiers, and common metadata files. The current repo has fixture coverage for React Native `0.70.6` and `0.77.1`, but only `0.77.1` is actively exercised by the root test suite. The package dependencies and tooling are outdated, and the Jest run is currently fragile because it relies on mutating tracked fixtures and Watchman behavior.

The revived version should focus on current React Native templates and avoid carrying old architecture-era fixture maintenance unless users request it.

## Support Policy

The active support window will be React Native `0.77+`.

React Native `0.70.6` will be removed from the active fixture matrix. Older versions may still work, but they will be documented as best effort and not covered by automated tests. If users report concrete issues on older versions, targeted legacy fixtures can be added back with tests for those cases.

The active fixture matrix will cover:

- React Native `0.77.1`, preserving the existing baseline.
- React Native `0.81.x`, covering the last migration-friendly release before New Architecture-only React Native.
- React Native `0.85.3`, covering the current latest version identified during planning.

## Dependency Strategy

Update direct runtime and development dependencies in controlled groups instead of one large blind bump. The first implementation pass should prioritize packages that affect install health, audit findings, and test reliability:

- Runtime candidates: `chalk`, `cheerio`, `commander`, `dotenv`, `globby`, `html-entities`, `replace-in-file`, `shelljs`, `update-check`.
- Development candidates: `esbuild`, `eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `husky`, `jest`, `lint-staged`, `prettier`.

Where a dependency can be replaced cleanly by native Node APIs, prefer removal over upgrade. This especially applies to `shelljs` for git/process/file operations and potentially `replace-in-file` for simple content replacement. Keep libraries where they reduce real complexity, such as XML parsing, unless a native replacement is clearly safer.

## Code Organization

The current source mixes CLI orchestration, validation, filesystem moves, git commands, XML updates, and React Native template rules. Refactoring should split responsibilities without changing the CLI surface:

- CLI entrypoint: parse options, validate inputs, call the rename workflow.
- Project inspection: read current app name, bundle IDs, project names, and file locations.
- File operations: move paths, replace file content, update XML/JSON files.
- Platform rules: iOS rename rules and Android rename rules.
- Git/build cleanup: optional staging, repo cleanliness checks, build folder cleanup.

The public command and documented options should remain compatible unless a breaking change is intentionally called out.

## Test Design

Tests should stop mutating tracked fixture directories directly. Each test run should copy a fixture into a temporary directory, initialize or reuse git state there, run the built CLI, and inspect the resulting diff or file contents. This makes tests repeatable, avoids dirty worktrees, and removes the need for destructive reset logic inside tracked fixtures.

Jest should run with Watchman disabled by default to avoid environment-specific failures. The test script should work on a clean machine without requiring a running Watchman service.

For each active React Native fixture, test the core rename flows:

- App name only.
- App name plus shared bundle ID.
- App name plus Android-only bundle ID.
- App name plus iOS-only bundle ID.

Snapshots can remain if the fixture diffs are stable, but structured assertions should be preferred for high-value expectations such as app display names, bundle identifiers, renamed iOS project paths, Android package paths, and React Native module names. If snapshots remain, they should be generated from temp fixture diffs rather than tracked fixture mutations.

## React Native Fixture Management

Remove `tests/rn-versions/0.70.6` from active testing. Add fixtures for React Native `0.81.x` and `0.85.3`. Fixture generation should be documented so future upgrades are repeatable.

The latest fixture should be periodically refreshed when React Native releases a new stable version. The support policy should explain that "latest" is a moving target at development time, while published releases are validated against the fixture versions committed in the repo.

## Risks

React Native native templates change frequently, especially iOS project files and Android Gradle conventions. The test matrix should catch common template shifts, but the implementation should avoid overly broad regular expressions where possible.

Removing `0.70.6` can disappoint users on older apps. The README should be explicit that older versions are best effort, and issue reports with reproducible fixtures are welcome.

Replacing dependencies with native code can reduce install and audit surface, but it should be done incrementally with tests around each behavior so the CLI does not regress.

## Acceptance Criteria

- The repo documents active support as React Native `0.77+`.
- The active test matrix covers `0.77.1`, `0.81.x`, and `0.85.3`.
- `0.70.6` is no longer part of active automated testing.
- Jest runs without Watchman.
- Tests run against temporary fixture copies and leave the worktree clean.
- Lint, build, and test commands pass after implementation.
- Dependency updates or removals reduce audit/tooling drift without changing the CLI contract unexpectedly.
