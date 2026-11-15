# SDD ledger — plan: openspec/changes/rn-taskito-foundation/

Plan: OpenSpec change rn-taskito-foundation (proposal.md, design.md, tasks.md, specs/native-app/spec.md).
Spec: openspec/changes/rn-taskito-foundation/specs/native-app/spec.md (the authority).
Constraint: server and webapp untouched — all work in mobile/app/ and mobile/android/ only. No web/src/lib changes, no internal/ changes.

Pre-flight: tasks share the foundation (sign-in, sync, Today) then build on it; section 1 gates sections 2-7. No conflicting interfaces found.


Task 1.1: complete (commits a1935e3..HEAD, tests: npx jest → 728/728)
  - PKCE pair + S256 challenge (src/signIn.ts), 19 tests in test/signIn.test.ts
  - Sign-in session over the native sheet (src/signInSession.ts), 7 tests in test/signInSession.test.ts
  - Token store over expo-secure-store (src/tokenStore.ts), 5 tests
  - Native bridge (src/nativeAuth.ts), App.tsx sign-in flow
  - Deps: expo-web-browser 58.0.7, expo-secure-store 58.0.2, expo-crypto 58.0.7, expo-linking 58.0.15 (exact pins, DEPENDENCIES.md)
  - Ruling: npm registry mirror cut-off ~2026-11-01, so the newest compatible Expo 58 versions were used (58.0.8+ exist but are post-cut-off) — if wrong, CI on a full registry will show a newer patch; cost is a version bump.
  - Ruling: native sheet result 'dismiss' treated as 'cancel' — expo-web-browser emits both; the user closed the sheet either way. Cost if wrong: a dismiss error message instead of a silent return.


Task 1.2: complete (commits 58b5e1d..HEAD, tests: npx jest → 741/741)
  - src/apiClient.ts: signed, server-prefixed fetch; Bearer token; refresh-once on 401; clear pair when refresh refused (10 tests)
  - src/account.ts: startAccount opens the account DB, setCurrentUserId, startSync; stopAccount stops sync + forgetAccount; installSyncHooks for tests (3 tests)
  - App.tsx: startAccount after sign-in, stopAccount at sign-out
  - test/setup-idb.ts: fake IndexedDB before shared db.ts loads (jest setupFiles)
  - Ruling: shared sync.ts uses global fetch + relative paths; the app wraps the platform fetch (apiClient) rather than touching webapp code — the wrapper is the boundary the shared modules already expect (platform fetch). Cost if wrong: sync.ts could later gain its own fetch injection; the wrapper is one place to change.
  - Ruling: installSyncHooks injection keeps the wiring testable without a simulator; the default is the real wiring. Cost if wrong: a hook set by a test leaks between tests; the tests reset with installSyncHooks(undefined-ish) per case.


Task 1.3: complete (commits 9b10aee..HEAD, tests: npx jest → 752/752)
  - src/today.ts: todayRows (shared todayTasks) + complete rule (2 tests over SQLite)
  - src/haptics.ts: expo-haptics over the shared preference (4 tests)
  - src/TodayScreen.tsx: native FlatList, checkbox 24/44, thread, empty state, Sign out
  - App.tsx: signed-in account shows TodayScreen
  - Deps: expo-haptics 58.0.2 (pinned, DEPENDENCIES.md)
  - Ruling: jest-expo lacks toBeTypeOf (jest 30 matcher), used typeof check — cost if wrong: none, the assertion is the same.
  - Ruling: completed_at reads null on the adapter (row default), not undefined — the test asserts null; cost if wrong: none, both mean open.


Task 2.1: complete (commits 36937e9..HEAD, tests: npx jest → 761/761)
  - src/ui/tokens.ts: palette light/dark (Taskito colors.xml), scale 22/16/13/11, contrastRatio, PAIRS
  - WCAG AA gate: 9 tests; two light colours darkened to pass (textSecondary #8a8f98→#686e78, medium #fb8c00→#b35c00)
  - Ruling: the Taskito palette fails AA on the light side; the spec says every pair passes, so the palette is adjusted (the gate is the requirement, the palette the input). Cost if wrong: the app looks slightly darker than Taskito on the light side.
  - Ruling: jest-expo has no toBeTypeOf/toBeGreaterThanOrEqual asymmetry issue; the pair loop throws a named error instead of expect().toBeGreaterThanOrEqual so the message names the pair. Cost if wrong: none.


Task 2.2: complete (commits 2.1..HEAD, tests: npx jest → 770/770)
  - src/navigation.ts: TABS (Today/Inbox/Upcoming/Browse), routes, Inbox badge (9 tests)
  - src/Shell.tsx: platform tab bar over 4 native stacks; Today real, others placeholder
  - Deps: react-native-screens 4.30.1, @react-navigation/native 7.5.1, native-stack 7.21.0, bottom-tabs 1.4.0, gesture-handler 3.4.0, reanimated 4.7.1
  - Ruling: react-native-bottom-tabs 1.4.0 (not 1.5.0) — 1.5.0 is post npm mirror cut-off. Cost if wrong: a version bump when the mirror updates.
  - Ruling: each tab gets its own NavigationContainer instead of one parent (bottom-tabs SceneMap doesn't nest a single container); independent containers per tab match design D1 "each tab keeps its own navigation stack". Cost if wrong: tab state is not shared across tabs; the screens do not need it.

