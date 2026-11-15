## ADDED Requirements

### Requirement: The app's visual language

The app SHALL define its own colour, type, spacing and motion tokens in `mobile/app/src/ui/tokens.ts`, derived from the palette in design D6, and SHALL use them for every screen. The app SHALL follow the phone's light and dark setting. Every text-on-background pair SHALL meet WCAG 2.2 AA, and a test SHALL fail when a pair does not.

#### Scenario: Light and dark follow the phone

- **WHEN** the phone switches from light to dark while the app is open
- **THEN** every screen redraws in the dark palette without a restart

#### Scenario: Contrast is checked

- **WHEN** a token pair falls below the AA ratio
- **THEN** the token test fails, naming the pair and the ratio

### Requirement: Tab navigation

The app SHALL use the platform's tab bar with four destinations: Today, Inbox, Upcoming and Browse. The Inbox tab SHALL show its count. Each tab SHALL keep its own navigation stack, and the platform's back gesture SHALL return within it. Every list SHALL carry the platform's search bar in its header. At most one row of chrome SHALL sit between the title and the first item.

#### Scenario: Back within a tab

- **WHEN** the user opens a task from Inbox, switches to Today and returns to Inbox
- **THEN** the task detail is still open, and an edge swipe returns to the Inbox list

#### Scenario: Search from any list

- **WHEN** the user types in the search bar of the Upcoming list
- **THEN** the results show over that list, and a task opened from a result returns to the list

### Requirement: The list screen

A task list SHALL show a vertical list of rows. Each row SHALL carry a checkbox on the left, a title, and at most three further properties: the date or time, the project when the row is not in its own project, and one icon line for priority, recurrence, subtasks and notes. Rows in one section SHALL be joined by a 2 px thread down the left edge in the accent colour; a section header SHALL break the thread and start a new one.

#### Scenario: A section header starts a new thread

- **WHEN** a list has an Overdue section above the Today section
- **THEN** the thread stops at the last overdue row and starts again at the first today row

#### Scenario: A row shows at most four properties

- **WHEN** a task has a description, tags, a project and a priority and is shown in Today
- **THEN** the row shows its title, its date, and its priority icon, and the rest wait in the task detail

### Requirement: Count cards

The Today list SHALL show three count cards above its rows: Remaining (today's open tasks), Overdue, and Unplanned (open tasks with no due date and no project the user chose them for). A tap on a card SHALL narrow the list to that set, and a second tap SHALL clear it. The cards SHALL be absent on Inbox and Upcoming.

#### Scenario: Unplanned is counted

- **WHEN** a task is added with no date and no project
- **THEN** the Unplanned card's count increases by one

#### Scenario: A card filters the list

- **WHEN** the user taps the Overdue card
- **THEN** the list shows only overdue tasks, and the card reads as chosen

### Requirement: Quick-add bar

Every list SHALL carry a quick-add bar at its bottom edge, above the keyboard when the keyboard is up. The bar's field SHALL be one line, SHALL run through the shared quick-add parser on every keystroke, and SHALL show each recognised span tinted inline with a chip in the toolbar above the keyboard. Return SHALL add the task, clear the field and keep the field focused. The list SHALL leave room for the bar and the keyboard so the last row stays reachable.

#### Scenario: Typing a date

- **WHEN** the user types "Call Sarah next Wed 3pm"
- **THEN** the words "next Wed 3pm" are tinted and a date chip shows, before Return

#### Scenario: Return keeps the bar ready

- **WHEN** the user presses Return with the text "Buy milk"
- **THEN** the task is added to the list with a haptic, the field is empty, and the keyboard stays up

#### Scenario: The last row is reachable

- **WHEN** the keyboard is up over a list longer than the screen
- **THEN** scrolling to the end shows the last row above the quick-add bar

### Requirement: Task detail

A task's detail SHALL be pushed onto the navigation stack. The title SHALL be a multi-line field at the top, and the notes SHALL be edited as Markdown text through the shared fold-in, so a note edited on the phone and on the web converge. The fields SHALL be a grouped list of When, Deadline, Project, Labels, Priority, Reminders and Repeat, each opening a native picker, and an unset field SHALL collapse into one "Add…" row. Subtasks, attachments and comments SHALL follow. Every change SHALL be written as an op at once, with no Save button.

#### Scenario: Notes converge with the web

- **WHEN** a note is edited on the phone offline and on the web at the same time, and both sync
- **THEN** both devices show the same note, and no paragraph is lost

#### Scenario: A fresh task shows only what is set

- **WHEN** a task with no date, no project and no labels is opened
- **THEN** the detail shows one "Add…" row for the fields, and no empty field rows

### Requirement: Pickers

Each picker SHALL be a native control. The date picker SHALL offer quick choices (Today, Tomorrow, This weekend, Next week, No date), a natural-language line run through the shared parser, the system calendar and a time. The entity pickers SHALL search the shared lists and write the same ids the web writes. The recurrence and reminder pickers SHALL produce the same canonical rules as the web's.

#### Scenario: A typed date is the web's date

- **WHEN** the user types "fri 15:00" in the date picker and confirms
- **THEN** the task's due value is the same one the web app stores for that text

#### Scenario: An unknown label name

- **WHEN** the user types a label that does not exist and confirms
- **THEN** the label is created in the task's workspace and the task carries it

### Requirement: Notification channels

The Android app SHALL declare the channels of design D7: `reminders` (Task reminders, high), `daily` (Daily and weekly reminders, default), `pinned` (Pinned notes, low) and `capture` (Create tasks, high). A reminder SHALL be shown on the `reminders` channel with Done, Snooze and Dismiss. The user SHALL be able to turn on the sticky capture notification, the Done action, a snooze length and a custom sound, and the app SHALL show one notification per reminder across its alarm and push paths.

#### Scenario: A reminder shows its channel

- **WHEN** a task's reminder fires
- **THEN** the notification is on the Task reminders channel, with Done, Snooze and Dismiss

#### Scenario: A custom sound

- **WHEN** the user picks a custom sound for reminders
- **THEN** the reminder notification plays that sound and the system default is not used

#### Scenario: Alarm then push

- **WHEN** a reminder is shown by the phone's alarm and a push of the same reminder arrives
- **THEN** one notification is shown and it does not alert twice

### Requirement: The home-screen widget

The Android widget SHALL show a scrollable list of a chosen list's tasks, defaulting to Today, with a checkbox on each row, in the light and dark palettes of the launcher's setting. A tap on a checkbox SHALL complete the task through the app's own completion, queued when offline, so a repeating task records the occurrence and moves to its next one. A tap on the header SHALL open the app at Today, and a footer button SHALL open quick add. The widget SHALL request nothing itself and SHALL be redrawn from a model the app publishes.

#### Scenario: Complete from the widget offline

- **WHEN** the user taps a row's checkbox in the widget with no network
- **THEN** the task is completed on the phone, the row folds away, and the completion is uploaded on reconnect

#### Scenario: A repeating task advances

- **WHEN** the user completes a daily task from the widget
- **THEN** today's occurrence is recorded and the task moves to tomorrow, on every device after sync

#### Scenario: The widget follows the theme

- **WHEN** the launcher switches to dark
- **THEN** the widget redraws in its dark palette without the app running