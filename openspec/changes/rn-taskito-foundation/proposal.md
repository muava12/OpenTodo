# Proposal

## Why

`native-app-foundation` built the React Native app's foundation and shipped it as a trial beside the web-view shells. The owner paused the screen work on 2026-11-13 and kept the shells (`mobile/AUDIT.md`, `native-app-everyday`).

The pause was right for the screens it was measured against: the shell can be made to feel native for the everyday list. But the pause also fixed the app's look to the web app's, and the shell cannot be given a different one. An owner who runs their own OpenTodo wants the app's screens to be theirs to shape, and wants the calm, one-thing-at-a-time feel of Taskito: a vertical list with a thread down the left, three count cards above it, and a quick-add bar at the bottom edge.

This change resumes `native-app-everyday` with that shape as its target, and adds what the shells cannot do: notification channels of the app's own, a home-screen widget with a scrollable list and a check on each row, and a capture that is one field wide open with the keyboard up.

It changes no server code and no op field. The app runs the shared TypeScript (`web/src/lib`) unchanged, so sync, the op log, encryption, dates, recurrence and the quick-add parser stay one implementation.

## What Changes

- **Resume the React Native app.** This change starts from what `native-app-foundation` has already written (the platform port, the storage adapter, the server screen). Where that change is still open (sign-in, the sync start, a minimal Today), this change builds what it needs of them itself, in its own sections, because no screen runs without them; it closes no task of another change.
- **The app's own visual language.** A light and dark palette, a type scale and spacing taken from the Taskito shapes this change names, as app-side tokens. The web app's theme is not imported; the app follows the phone's light or dark setting and later its own choice.
- **Four tabs**, not the web's six: Today, Inbox, Upcoming, Browse. Search is reachable from every list through the platform's search bar, not a tab of its own.
- **The list screen.** A vertical list with a checkbox and a thread down the left edge, a title, a secondary line, and a row of tag chips. Above it, three count cards: Remaining, Overdue and Unplanned. A quick-add bar sits at the bottom edge, above the keyboard when it is up. A floating add button is not used: the bar is the add button.
- **Capture.** The quick-add bar's field runs through the shared parser on every keystroke. Recognised spans are tinted inline and shown as chips in a toolbar above the keyboard; each chip opens the same picker as the task detail. Return adds the task and keeps the field clear for the next one.
- **Task detail** pushed onto the stack: the title and notes in place, grouped rows for When, Deadline, Project, Labels, Priority, Reminders and Repeat, each opening a native picker, and subtasks with progress.
- **Notifications.** The Android app declares its own channels: Task reminders, Daily and weekly reminders, Pinned notes, and Create task from notification. A reminder's notification offers Done, Snooze and Dismiss, as today. The user can turn on "Create tasks from notification", a sticky reminder, a custom sound, and a snooze length.
- **A home-screen widget with a real list.** A scrollable list of Today's (or a chosen list's) tasks, with a checkbox on each row, a light and dark rendering, and a button that opens quick add.

Out of scope: the calendar, boards, timeline, Focus, the weekly review, Plan, automations, the assistant, maps, the notes graph, theme editing, and the integrations. They open on the web, as `native-app-everyday` says. The iOS shell is untouched; the iPhone app stays the web view until a separate change.

Advances the ROADMAP item "Shells that feel native", and closes GitHub issue #1240 (a more useful Android widget).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `native-app`: the app's visual language, the four tabs, the list screen, capture, task detail, notifications and the widget, on the foundation's stack.
- `native-shells`: the Android shell's notification channels and the widget's list, declared in the shell's own right.

## Impact

- **Code:** `mobile/app/src/` screens, components, tokens and pickers; `mobile/app/src/storage/lists.ts` gains the counts the list screen shows; `mobile/android` gains the widget's collection view and the channel declarations.
- **Shared code:** `web/src/lib` unchanged apart from any module the screens import that is not yet in `shared-modules.json`; the boundary check (`scripts/shared-boundary.mjs`) keeps the list honest.
- **Server:** none.
- **Op schema:** none. Every write is an existing op through `mutate()`.
- **Tests:** Jest component and logic tests; Maestro flows for capture, complete and the notification actions; a widget draw test on Android.
- **Size:** the app's own bundle, not the web's. The web's first load and entry budgets are untouched, because no shared module grows for the app alone.

## Risks

- The pause happened once for a reason: two disappointed releases cost more than one. This change ships behind a trial build on TestFlight and a sideloaded APK, next to the shell, as the foundation did.
- A second visual language is a second thing to keep in step with the design system. The app's tokens are the app's; the shared parts are the parser, the sync engine and the pickers' data, not the drawing.