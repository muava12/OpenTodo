// The thread and the section headers (OpenSpec change rn-taskito-foundation,
// task 3.2): the thread joins the rows of one section, and a section header
// breaks it. The rule is the row group's, pure so it is tested without a screen.

/** A header row, or a task row. */
export type Item =
  | { kind: 'header'; title: string }
  | { kind: 'row'; id: string }

/** An item with its thread flag and its section. */
export type Group =
  | { kind: 'header'; title: string; thread: false }
  | { kind: 'row'; id: string; thread: boolean; section: string }

/**
 * The thread flag of each item: a row joins the previous row's thread; a header
 * has no thread and starts a new one after it.
 */
export function groups(items: readonly Item[]): Group[] {
  const out: Group[] = []
  let section = ''
  for (const item of items) {
    if (item.kind === 'header') {
      out.push({ kind: 'header', title: item.title, thread: false })
      section = item.title
    } else {
      const thread = out.length > 0 && out[out.length - 1].kind === 'row' && (out[out.length - 1] as { section?: string }).section === section
      out.push({ kind: 'row', id: item.id, thread, section })
    }
  }
  return out
}