# Design

## Context

- **Prerequisites.** `native-app-foundation` provides the app's place in the repo, the shared-code boundary (`shared-modules.json`, `scripts/shared-boundary.mjs`), the platform port (`web/src/lib/platform.ts`), SQLite storage through the Dexie-subset adapter (`mobile/app/src/storage/`), app sign-in through the system browser, the sync engine and the CI lanes (foundation D1–D10).
- **What is already written.** `mobile/app/src/` holds the platform port implementation, the storage adapter and its four phone-only indexes (`lists.ts`), and a minimal server screen. Sign-in, the sync start and a minimal Today are open tasks of the foundation; this change closes them as its own first section, because no screen runs without them.
- **What is reusable.** The shared modules decide what each list shows and how a typed line is read: `closedList`, `flow`, `inbox`, `liveTasks`, `nlp/*`, `recurrence`, `dates`, `ops` and `mutate()`, `noteSearch`, `i18n`. The drawing is new; the deciding is not.
- **What is new.** The app's visual language, the four tabs, the list screen, the capture bar, the task detail, the pickers, the notification channels and the widget.

## Goals / Non-goals

**Goals**
- Every interaction uses the platform's own control or gesture where one exists.
- Capture is the fastest thing in the app: one field, open and typing within a moment.
- The app is calm: one row of chrome above a list, no helper text, one thing to do at a time.
- Nothing new is written outside the op log, and every screen works offline.

**Non-goals**
- Reproducing the web app's layouts, its theme or its sidebar.
- The planning screens that need a large surface: the calendar, boards, the timeline, Plan, Focus, the review, automations, the assistant, the graph.
- The iPhone. The iOS app stays the web-view shell until a change of its own.

## Decisions

### D1. Four tabs

| Tab | Shows | Why |
|---|---|---|
| Today | Today's list with the closed-list rule, then Overdue, then Unplanned (`closedList`, `flow`) | The screen opened most |
| Inbox | Unprocessed capture (`inbox`), with triage swipes | Capture's destination |
| Upcoming | The next 14 days as list sections | "What is coming" |
| Browse | Projects, Labels, Saved views, Notes, Settings | The rest, one level down |

The web's six destinations become four: Search is not a tab, because every list has the platform's search bar in its header, and the result is one tap away wherever the user is. Settings sits at the bottom of Browse, as on the phone platforms.

Alternatives:
- **Five tabs with Search, as `native-app-everyday`.** Rejected for now: on the phone the search bar reaches the same place with one tap and no tab, and four tabs leave the width for a label that is not cut.
- **A sidebar drawer.** Rejected: drawers are not native on either platform and hide where the user is.

The Inbox tab shows its count as a badge, and Today's count when the user has turned the app badge on.

### D2. The list screen: a thread, a checkbox, and count cards

The shape this change takes from Taskito (`timeline_screen_layout.xml`, `timeline_task_item_layout.xml`, `timeline_today_item_layout.xml` in the APK's decoded resources):

```
┌──────────────────────────────────┐
│ Today                    ⌕  ⋯    │  one row of chrome, large title
│ [Remaining] [Overdue] [Unplanned]│  three count cards
├──────────────────────────────────┤
│ ○ Task one                       │  a checkbox and a 2 px thread down
│ │   a secondary line             │  the left edge, in the accent colour
│ │   [label] [label]              │
│ ○ Task two                       │
│ ○ Task three                     │
├──────────────────────────────────┤
│ [ Add a task…              + ]   │  the quick-add bar at the bottom edge
└──────────────────────────────────┘
```

- **The thread.** A 2 px vertical line in the accent colour joins each row's checkbox to the next, so a list reads as one column rather than as cards. It stops at the last row of a group. A section header (Overdue, Unplanned, a project) breaks the thread and starts a new one.
- **The checkbox.** A 24 px circle, with a 44 px touch target. A tap completes with a haptic; the row stays for the completion grace period with Undo, then folds away.
- **A row.** At most four properties: the title, the date or time, the project when the row is not in its own project, and one icon line for priority, recurrence, subtasks and notes. Descriptions and tags show only when the row is the last in its block, or when the user turns on "Show notes in the list".
- **The count cards.** Three cards under the title: Remaining (today's open tasks), Overdue, and Unplanned (dated tasks with no date, `inbox`-adjacent but not the Inbox: tasks whose date is not set and that are not in the Inbox). A tap on a card filters the list to that set. The cards are absent on Inbox and Upcoming.
- **Chrome.** One row: the title, and up to two actions in a `⋯` menu. No banner, no helper text.

Alternatives:
- **The web's card rows, as the shell shows them.** Rejected: a card per task is what the shells do, and it is what this change exists to get away from.
- **A section header per day with no thread.** Rejected: the thread is the thing that makes a long list read fast, and it is the shape the owner asked for.

### D3. Capture: one bar at the bottom edge

- **The bar.** A single line field at the bottom of every list, above the keyboard when it is up. It is always visible; there is no floating action button, because the bar is the add button. On a list with a project or a label, a task added from the bar goes there.
- **Parsing as you type.** The text runs through the shared `nlp/quickadd` on every keystroke. Recognised spans are tinted inline, and each becomes a chip in a toolbar directly above the keyboard. Tapping a chip opens the picker for that property; tapping the chip's cross removes it.
- **The toolbar.** Date, Project, Labels, Priority and Reminder by tap, each opening the same native picker as the task detail. The toolbar is horizontally scrollable and sits under the chips row.
- **Return.** Adds the task with a light haptic, clears the field and keeps the bar focused for the next one. The keyboard stays up.
- **The full screen.** A long press on the bar, or the `⋯` menu's "Open the editor", opens the task detail with the same text, for a long description or several reminders.

Alternatives:
- **A sheet at the medium detent, as `native-app-everyday` designed.** Rejected for this app: a sheet hides the list, and the list is where the user is. The bar is the Taskito shape and it keeps the list in view.
- **A floating action button.** Rejected: it covers the last row and needs a second tap to reach the field.

### D4. Task detail: pushed, edited in place

- **Opening.** A tap on a row pushes the detail onto the stack: an edge swipe goes back, and the title collapses into the bar.
- **Title and notes.** The title is a multi-line field at the top; notes sit under it, edited as Markdown text through the shared path that folds plain text into the note's document (`ops.ts`, `collaborative-rich-text`), so a note edited on the phone and on the web converge. Formatting the plain text cannot express, such as tables, shows read-only with "Edit on the web".
- **Fields.** An inset grouped list: When, Deadline, Project, Labels, Priority, Reminders and Repeat. An empty field collapses into one "Add…" row, so a fresh task shows only what is set.
- **Below the fields.** Subtasks with progress, attachments (open with the platform's viewer) and comments, read and add.
- **Saving.** Every change writes an op at once. There is no Save button, and a toast offers Undo for destructive changes.

### D5. Pickers

Every picker is a native control: the platform's date picker with a natural-language line above it, the searchable entity sheet for a project, a label or a view, the priority menu, the recurrence sheet (the presets and a custom rule), and the reminder sheet (relative, absolute, and the default reminders). Each picker reads the same shared vectors the web's does, so a rule typed on the phone is the rule the web stores.

### D6. The visual language

The app's own tokens, in `mobile/app/src/ui/tokens.ts`, derived from the Taskito palette in the APK's `colors.xml`:

| Token | Light | Dark |
|---|---|---|
| accent | `#3c8dff` | `#3c8dff` |
| background | `#ffffff` | `#14161a` |
| surface | `#f4f4f9` | `#1c1f24` |
| text | `#343434` | `#eaeaf0` |
| textSecondary | `#8a8f98` | `#9aa0aa` |
| line | `#eaeaf0` | `#2c3036` |
| high / medium / low | `#e53935` / `#fb8c00` / `#1e88e5` | the same |

- Type: the platform's own font at a scale of 22 (the screen title), 16 (a row's title), 13 (a secondary line) and 11 (a badge), with the platform's line heights.
- Spacing: 4, 8, 16, 24. A row's minimum height is 48, its touch target 44.
- Motion: the platform's own transitions; the app adds no animation library.
- Contrast: every pair above is checked against WCAG AA, and the check is a test.

Alternatives:
- **Import the web app's theme tokens.** Rejected: the web's tokens are many and include the density, the note and the graph, and the app would carry a language it does not draw in. The app keeps six colours and a type scale.

### D7. Notifications and their channels

The Android app declares the channels Taskito declares, each with its own name and its own importance:

| Channel | Importance | What it carries |
|---|---|---|
| `reminders` (Task reminders) | High | A task's reminder, with Done, Snooze and Dismiss |
| `daily` (Daily and weekly reminders) | Default | A digest or a routine's nudge |
| `pinned` (Pinned notes) | Low | A note the user pinned to notifications |
| `capture` (Create tasks) | High | The quick-add notification, when the user turns it on |

- **The reminder notification** offers Done, Snooze and Dismiss, as today (`reminders`' "Done from a reminder notification"). The action labels are the app's own strings, not the web's.
- **User choices, in Settings → Notifications:** "Create tasks from notification" (the sticky capture notification), "Show snooze option" with a length, "Show Done action", and a custom sound through a second, silent-twin channel per sound, as Taskito does.
- **iOS.** The shell keeps its own single channel, because iOS has no user-visible channels; the settings that do not apply there are hidden.
- **One notification per reminder.** The id comes from the reminder's id, so an alarm and a push never show twice, as `reminders` already requires.

### D8. The home-screen widget

A collection widget, not a static one:

- **A list.** A `ListView`/`LazyColumn` over a `RemoteViewsService` on Android, the same rows as the Today list, capped at the rows the widget's height shows.
- **A check on each row.** A tap on the checkbox completes the task through the app's own completion, so a repeating task records the occurrence and moves on. The write is an op, queued when offline.
- **Two sizes.** A small one (four rows) and a large one (the full list, scrollable).
- **A header** with the count and a tap that opens the app at `/today`; a footer button that opens quick add at `/?add=`.
- **Theme.** Light and dark from the launcher's setting, using the widget's own colours, not the app's runtime theme.
- **Refresh.** The web app publishes the model over the bridge, as `shellPublish` does today (`Widgets.kt`), and the app republishes after a change. The widget itself requests nothing.

Alternatives:
- **A static widget of five rows, as today.** Rejected: issue #1240 names it, and the shell's own audit calls it not useful.
- **A Kotlin widget that reads the database directly.** Rejected: it would need the encryption key and the sync state in the widget process, and a second reader of the op log.

### D9. Accessibility

Every control has a label and a role; the completion, the swipe and the checkbox each expose an accessibility action; the app respects the platform's text size, its reduce-motion setting and its bold-text setting; the contrast check of D6 is a test. The app targets WCAG 2.2 AA, the same bar as the web.

### D10. Testing and review without a Mac

- **Jest** runs the logic, the tokens, the pickers' data and the list's rows on Linux, in `make app`.
- **Maestro** flows run on the simulator and the emulator in `app-ios` and `app-android`, nightly and on a pull request that changes `mobile/app/`.
- **Screenshots** of every screen in light and dark are CI artifacts for review.
- **The widget** has a draw test on the emulator, and a Maestro flow that taps a row's checkbox and asserts the task's completion through the REST API.

## Data model

No new field, no op change. The app reads and writes the same entities through the same shared modules. The counts the list screen shows come from the existing selectors; the widget's model is published from the same rows.

## Size and memory

The app's own bundle, not the web's. The budgets of `docs/performance.md` (`app-simulator`, `app-iphone`) hold: cold start to Today, Inbox at 300 ms, a pull page at 400 ms with no frame over 50 ms, a completion at 50 ms. The widget adds no dependency. The list library is the one the foundation's spike picks (`@legendapp/list` or `@shopify/flash-list`), recorded in this change's tasks.

## Risks / Trade-offs

- **The pause happened for a reason.** Two disappointed releases cost more than one. The app ships as a trial build next to the shell, as the foundation did, and the shell is not retired by this change.
- **A second visual language.** The app's tokens are the app's; the shared code is the deciding, not the drawing. A change to the web's design does not move the app, and a change to the app's does not move the web.
- **The quick-add bar covers the last row.** The list adds bottom padding equal to the bar plus the keyboard inset, and the last row is always reachable.
- **The thread is a drawing, not a control.** It is a view behind the rows, so it costs one pass and no per-row work.

## Migration Plan

1. Build what the foundation left open that this change needs (sign-in, the sync start, the minimal Today) as this change's own first section, with its Maestro flows. The foundation's own tasks stay as they are, in its own change.
2. Land the tokens, the four tabs and the list screen.
3. Land capture and the task detail.
4. Land the notification channels and the widget.
5. Ship the trial build to TestFlight and as an APK, beside the shell. Retire the shell only in a later change, after the owner and the testers compare.

## Open Questions

- The list library: `@legendapp/list` against `@shopify/flash-list`, by the foundation's spike and this change's 2,000-row test.
- Whether the Inbox tab keeps a count badge, given that the Inbox is one tap from Today. The design says yes; the phone check decides.