# Mobile app

React Native app for Low Level Lab. It is managed with pnpm and lives in the repository workspace at `apps/mobile`.

## Prerequisites

- Node.js 22.11 or newer
- pnpm 10
- Android Studio, an Android SDK, and either an Android emulator or a USB-connected Android device
- For iOS development, macOS with Xcode and CocoaPods

Android Studio setup is covered by the React Native environment guide: <https://reactnative.dev/docs/set-up-your-environment>.

## First-time setup

From this directory, install the workspace dependencies:

```sh
pnpm install
```

On macOS, also install the iOS native dependencies:

```sh
bundle install
bundle exec pod install --project-directory=ios
```

## Local Android development

Use three terminals: one for Metro, one for the emulator, and one to install/run the app.

### 1. Start Metro

From `apps/mobile`, run:

```sh
pnpm start
```

Keep this terminal open. Metro serves the JavaScript bundle at port 8081 and reports bundling errors as you work.

### 2. Start an emulator

You can launch an AVD from Android Studio Device Manager. From a terminal, list AVDs and start one with:

```sh
emulator -list-avds
emulator -avd <avd-name>
```

If `emulator` is not on your `PATH`, use the executable inside your Android SDK, for example:

```sh
$ANDROID_HOME/emulator/emulator -avd <avd-name>
```

Wait until the Android home screen is visible, then confirm it is connected:

```sh
adb devices
```

### 3. Install and launch the app

In another terminal at `apps/mobile`, run:

```sh
pnpm android
```

The command builds the debug APK, installs it on the connected emulator/device, and opens the app. With Metro already running, it reuses that server.

## Working on the app

Edit [`App.tsx`](./App.tsx) or other source files. Fast Refresh updates the running app after saving.

- Press <kbd>R</kbd> twice in the emulator to fully reload.
- Open the developer menu with <kbd>Ctrl</kbd> + <kbd>M</kbd> on Linux/Windows or <kbd>Cmd</kbd> + <kbd>M</kbd> on macOS.
- Watch the Metro terminal for JavaScript errors and the Android/Gradle terminal for native build errors.

## Physical Android device

Enable USB debugging, connect the device, and confirm that it appears in `adb devices`. Then make the device able to reach Metro on your machine:

```sh
adb reverse tcp:8081 tcp:8081
pnpm android
```

Run the `adb reverse` command again after reconnecting the device or restarting ADB.

## Common fixes

### App shows “Unable to load script”

Ensure Metro is running and the device has a path to port 8081:

```sh
pnpm start -- --reset-cache
adb reverse tcp:8081 tcp:8081
```

Then reload the app. For an emulator, `pnpm android` normally configures the connection automatically.

### Metro cannot resolve a package

Install dependencies from this workspace directory and restart Metro with a clean cache:

```sh
pnpm install
pnpm start -- --reset-cache
```

The Metro configuration already supports the repository pnpm workspace layout.

### Rebuild after native changes

After editing Android native files or adding a native dependency, reinstall the debug build:

```sh
pnpm android
```

## iOS (macOS only)

With Metro running, launch the iOS app with:

```sh
pnpm ios
```

Run `bundle exec pod install --project-directory=ios` again whenever native iOS dependencies change.

## Checks

```sh
pnpm lint
pnpm test
```
