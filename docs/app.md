---
title: The native app
summary: The OpenTodo app for Android and iPhone: four tabs, capture, reminders, the widget, built on the app's own screens.
audience: user
section: Reference
specs: []
screens: []
order: 23
---
# The OpenTodo app (native, React Native)

The app is the OpenTodo web app's own code on a native shell: the shared
TypeScript (`web/src/lib`) runs unchanged behind the platform port, and the
screens are drawn with the platform's own views. This is the app of
OpenSpec change `rn-taskito-foundation`, the trial beside the web-view shells.

## What it is

- **Four tabs**: Today, Inbox, Upcoming, Browse.
- **Today**: the shared `todayTasks`, the three count cards (Remaining,
  Overdue, Unplanned), the quick-add bar, and a tap on a row that completes
  the task with a haptic and an Undo.
- **Capture**: the shared quick-add parser (`nlp/quickadd`) over the typed
  line, with chips for each recognised attribute.
- **Task detail**: the title and notes at the top, the field rows, a back.
- **Notifications**: the Android app declares its own channels (Task
  reminders, Daily and weekly, Pinned notes, Create tasks).
- **The widget**: the Today list, a checkbox per row, the quick-add footer.

## How it is built

- `mobile/app/` is the React Native app (Expo, New Architecture); the native
  projects are generated in CI (`expo prebuild`), never committed.
- `mobile/android/` is the Android shell (Kotlin, AndroidX only), which
  loads the app and adds the reminders, the widgets and the app lock.
- `mobile/app/src/` is the app's own code; `mobile/app/src/ui/tokens.ts` is
  its palette (the Taskito colours, WCAG AA gated).
- The app's state is the shared `db.ts` on the SQLite adapter
  (`mobile/app/src/storage/`), one file per account.
- The app signs in through the system browser (`expo-web-browser`), with
  PKCE; the tokens live in the Keychain/Keystore (`expo-secure-store`).
- Sync runs through the shared `sync.ts`; the app wraps the platform fetch
  with the signed, server-prefixed client (`src/apiClient.ts`).

## What stays on the web

The calendar, boards, the timeline, Focus, the weekly review, Plan,
automations, the assistant, maps, the notes graph and the integrations. They
open on the web, as the change's design says; each can come to the app in
its own change, if it suits a phone.

## Development

- `make app` runs the type-check, the lint and the Jest suite on Linux
  (no Mac needed).
- `app-ios` and `app-android` build the app on a pull request that changes
  `mobile/app/`, and nightly.
- The app's tests are `*.test.ts` with Jest (the shared vectors), and the
  Android unit tests are under `mobile/android/app/src/test/`.

## Release

The app ships as a sideloaded APK and through the stores; the signing keys
are the owner's. The reproducible build is `scripts/android-repro.sh` (the
web-view shell's), and the native app's is the CI build of the tag.