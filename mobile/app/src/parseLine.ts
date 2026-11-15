// The quick-add bar's parse (OpenSpec change rn-taskito-foundation, task 4.1):
// the shared parser over the typed line, and the chips it yields. The parse is
// the shared nlp's; this module shapes its chips for the bar's toolbar.
import { parse, type ParseContext, type ParseResult } from '@shared/nlp/parse'
import type { Span } from '@shared/nlp/tokenize'

/** A chip the bar's toolbar shows. */
export interface Chip {
  kind: 'date' | 'time' | 'project' | 'priority' | 'estimate' | 'deadline'
  label: string
  span: Span
}

const spanOf = (chips: ParseResult['chips'], kind: string): Span =>
  chips.find((c) => c.kind === (kind as never))?.spans[0] ?? { start: 0, end: 0, text: '' }

/** The chips of a parse result, in the order the bar shows them. */
export function chipsOf(result: ParseResult): Chip[] {
  const out: Chip[] = []
  if (result.due?.date) out.push({ kind: 'date', label: result.due.date, span: spanOf(result.chips, 'due') })
  if (result.due?.time) out.push({ kind: 'time', label: result.due.time, span: spanOf(result.chips, 'due') })
  if (result.projectId) out.push({ kind: 'project', label: result.projectId, span: spanOf(result.chips, 'project') })
  if (result.priority) out.push({ kind: 'priority', label: `p${result.priority}`, span: spanOf(result.chips, 'priority') })
  if (result.estimateMinutes) out.push({ kind: 'estimate', label: `${result.estimateMinutes}m`, span: spanOf(result.chips, 'estimate') })
  if (result.deadline) out.push({ kind: 'deadline', label: result.deadline, span: spanOf(result.chips, 'deadline') })
  return out
}

/** The parse of a line in the bar, with the context the app can give. */
export function parseLine(line: string, ctx: Omit<ParseContext, 'today' | 'languages'> & { today: string; languages?: readonly string[] }): ParseResult {
  return parse(line, { languages: ['en'], ...ctx } as ParseContext)
}