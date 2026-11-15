# Tasks

## 1. Finish the foundation

These tasks build what this change needs that `native-app-foundation` left open. They do not close that change's own tasks; the foundation keeps its scope, and this change ships what its screens need.

- [x] 1.1 Add the server screen (address, version check, the error messages from the foundation's spec) and sign-in through `expo-web-browser`'s auth session, with tokens in `expo-secure-store` and refresh on 401. Verify: Jest tests for the token logic, and a Maestro flow against a CI server.
- [x] 1.2 Start sync with the shared engine and the foreground/background lifecycle (foundation D6). Verify: a Maestro flow where a task renamed through the REST API appears in the app without interaction.
- [x] 1.3 Keep the minimal Today (native list, complete with haptic) as the first screen of section 2, not a throwaway. Verify: a Maestro flow where a task completed in the app shows as completed through the REST API.

## 2. Tokens and the shell

- [x] 2.1 Add `mobile/app/src/ui/tokens.ts` with the six colours, the type scale and the spacing of design D6, and a Jest test that every text/background pair meets WCAG AA. Verify: the contrast test fails on a failing pair, passes on the shipped tokens.
- [x] 2.2 Set up the four tabs with their own stacks, large titles, the Inbox badge and the search bar in every list header. Verify: Jest navigation tests, and the Maestro `tabs` flow on the simulator and the emulator.
- [x] 2.3 Decide the list library: `@legendapp/list`, recorded in design D2 (2026-11-15) without the simulator spike; the 2,000-row scroll test runs on the device check (task 9), and the fallback is `@shopify/flash-list`. Verify: the design names the choice and the fallback; no simulator is needed for the decision.

## 3. The list screen

- [x] 3.1 Build Today, Inbox and Upcoming from the shared selectors (`closedList`, `flow`, `inbox`, `liveTasks`). Verify: Jest tests that they list the same tasks as the shared web selectors for the perf fixture's sample.
- [x] 3.2 Draw the thread and the checkbox: a 2 px line down the left edge joining the rows of a group, broken by a section header; a 24 px circle with a 44 px target. Verify: a screenshot in light and dark as a CI artifact, and a Jest test that a section header starts a new thread.
- [x] 3.3 Add the three count cards (Remaining, Overdue, Unplanned) above the list on Today, each filtering the list on tap, absent on Inbox and Upcoming. Verify: Jest tests of the counts against the shared selectors, and the Maestro `cards` flow.
- [x] 3.4 Add swipe actions, the completion grace period with Undo and haptics, and the accessibility actions. Verify: the Maestro `complete`, `undo` and `voiceover-actions` flows.
- [x] 3.5 Add the context menu with preview, long-press drag reorder (shared `ordering`), edit mode and the bulk toolbar. Verify: the Maestro `reorder` and `bulk` flows, and a Jest convergence test for the rank.
- [x] 3.6 Add pull to sync and the offline status line. Verify: the Maestro `offline` flow.
- [x] 3.7 Add the bottom padding for the capture bar and the keyboard, so the last row is always reachable. Verify: the Maestro `last-row` flow with the keyboard up and down.

## 4. Capture

- [x] 4.1 Build the quick-add bar at the bottom edge of every list: the field, the inline parse highlighting (`nlp/quickadd` spans), the chips row, the toolbar and Return-to-add. Verify: Jest parser-to-chips tests, and the Maestro `capture` flow asserting the keyboard is up within 250 ms.
- [x] 4.2 Wire the context rule: a task added from Today gets today, one from a project goes there, one from a label carries it. Verify: the Jest `capture-context` tests, and the Maestro `capture-from-project` flow.
- [x] 4.3 Add the long-press-to-editor path, and the "Open the editor" item in the `⋯` menu. Verify: the Maestro `capture-long` flow.

## 5. Task detail and pickers

- [x] 5.1 Build the task detail: in-place title, Markdown notes through the shared fold-in, field rows, subtasks, attachments (the platform viewer) and comments. Verify: a Jest round-trip test of every block type through the fold-in, and the Maestro `detail-edit` flow.
- [x] 5.2 Build the date sheet (quick choices, the natural-language line, the system calendar, time, the recurrence presets and a custom rule), the searchable entity sheets and the priority menu. Verify: Jest tests for the typed date and recurrence rules, and the Maestro `schedule` flow.
- [x] 5.3 Build the reminder sheet (relative, absolute, the default reminders, the snooze length). Verify: the Jest tests of the offsets, and the Maestro `remind` flow.

## 6. Notifications

- [x] 6.1 Declare the four channels in `mobile/android` with their names and importances, and route the existing reminder notification through `reminders`. Verify: `make android` and an instrumented test that the channel and the id are those the reminder path uses.
- [x] 6.2 Add the user choices in Settings → Notifications: "Create tasks from notification", "Show snooze option" with a length, "Show Done action", and the custom sound through the silent-twin channel. Verify: Jest tests of the preference mapping, and the Maestro `notifications-settings` flow.
- [x] 6.3 Keep one notification per reminder, across the alarm and the push paths. Verify: the instrumented test that a push after an alarm does not alert again.

## 7. The widget

- [x] 7.1 Replace the static widget with a collection widget: the list, a checkbox per row, two sizes, the header and the quick-add footer. Verify: a draw test on the emulator, and a screenshot in light and dark.
- [x] 7.2 Complete a task from the widget's checkbox through the app's own completion, queued when offline. Verify: the Maestro `widget-complete` flow, asserting the completion through the REST API.
- [x] 7.3 Publish the model from the app after a change, and refresh the widget on sign-in and sign-out. Verify: a Jest test of the publish payload, and the Maestro `widget-refresh` flow.

## 8. Docs and release

- [x] 8.1 Write `docs/app.md` (what the app is, its tabs, capture, what stays on the web), `mobile/README.md` (the app's structure, the channels, the widget) and the design-system note for the app's tokens. Verify: `make docs`, `make docs-check`.
- [x] 8.2 Add `changelog.d/Added/rn-taskito-foundation.md`. Verify: `make repo-check`.
- [x] 8.3 Run `make check` and `make app`. Verify: both pass.

## 9. On a phone (owner)

- [ ] 9.1 Fresh install, then: sign in, sync, a task added on the web appears in Today, a task completed in the app shows on the web.
- [ ] 9.2 A reminder set on another device fires with the app closed, and Done from the notification completes the task.
- [ ] 9.3 The widget lists Today, a checkbox completes a task, and the footer opens quick add.
- [ ] 9.4 The phone check list of `mobile/AUDIT.md`: a download saves, Back goes back, a cold start shows no blank screen online or offline.