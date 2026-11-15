// Reminder time arithmetic (OpenSpec change rn-taskito-foundation, task 5.3):
// the offsets, presets, labels, fire_at computation, and due/delivered/dismissed
// checks. Mirrors web/src/lib/reminderTime.ts.
import {
  DEFAULT_REMINDER_TIME,
  dueInstant,
  relativeFireAt,
  deadlineFireAt,
  isDelivered,
  isDismissed,
  isDue,
  snoozeUntil,
  offsetLabel,
  deadlineOffsetLabel,
  reminderLabel,
  RELATIVE_PRESETS,
  DEADLINE_PRESETS,
} from '../src/reminders'
import type { Reminder } from '@shared/types'

describe('dueInstant', () => {
  it('reads a date and time in local time', () => {
    const ms = dueInstant({ date: '2026-11-15', time: '10:00' })
    const d = new Date(ms)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(10) // November = 10
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(10)
    expect(d.getMinutes()).toBe(0)
  })

  it('uses the default time when none is given', () => {
    const ms = dueInstant({ date: '2026-11-15' })
    const d = new Date(ms)
    const [hh, mm] = DEFAULT_REMINDER_TIME.split(':').map(Number)
    expect(d.getHours()).toBe(hh)
    expect(d.getMinutes()).toBe(mm)
  })
})

describe('relativeFireAt', () => {
  it('fires at due time with zero offset', () => {
    const due = { date: '2026-11-15', time: '10:00' }
    expect(relativeFireAt(due, 0)).toBe(dueInstant(due))
  })

  it('fires 30 minutes before due', () => {
    const due = { date: '2026-11-15', time: '10:00' }
    expect(relativeFireAt(due, -30)).toBe(dueInstant(due) - 30 * 60_000)
  })

  it('fires 1 hour after due', () => {
    const due = { date: '2026-11-15', time: '10:00' }
    expect(relativeFireAt(due, 60)).toBe(dueInstant(due) + 60 * 60_000)
  })

  it('returns null without a due date', () => {
    expect(relativeFireAt(null, -30)).toBeNull()
  })

  it('treats null offset as zero', () => {
    const due = { date: '2026-11-15', time: '10:00' }
    expect(relativeFireAt(due, null)).toBe(dueInstant(due))
  })
})

describe('deadlineFireAt', () => {
  it('fires at 09:00 on the deadline day with zero offset', () => {
    const ms = deadlineFireAt('2026-11-20', 0)
    expect(ms).not.toBeNull()
    const d = new Date(ms!)
    expect(d.getDate()).toBe(20)
    expect(d.getHours()).toBe(9)
  })

  it('fires 1 day before the deadline', () => {
    const ms = deadlineFireAt('2026-11-20', -1440)
    const d = new Date(ms!)
    expect(d.getDate()).toBe(19)
    expect(d.getHours()).toBe(9)
  })

  it('returns null without a deadline', () => {
    expect(deadlineFireAt(null, 0)).toBeNull()
    expect(deadlineFireAt(undefined, 0)).toBeNull()
  })
})

describe('isDelivered', () => {
  it('is delivered when delivered_at >= fire_at', () => {
    const r = { delivered_at: 2000, fire_at: 1000 } as Reminder
    expect(isDelivered(r)).toBe(true)
  })

  it('is not delivered when delivered_at < fire_at', () => {
    const r = { delivered_at: 500, fire_at: 1000 } as Reminder
    expect(isDelivered(r)).toBe(false)
  })

  it('is not delivered when delivered_at is null', () => {
    const r = { delivered_at: null, fire_at: 1000 } as Reminder
    expect(isDelivered(r)).toBe(false)
  })
})

describe('isDismissed', () => {
  it('is dismissed when dismissed_at >= fire_at', () => {
    const r = { dismissed_at: 2000, fire_at: 1000 } as Reminder
    expect(isDismissed(r)).toBe(true)
  })

  it('is not dismissed when dismissed_at < fire_at', () => {
    const r = { dismissed_at: 500, fire_at: 1000 } as Reminder
    expect(isDismissed(r)).toBe(false)
  })

  it('is not dismissed when dismissed_at is null', () => {
    const r = { dismissed_at: null, fire_at: 1000 } as Reminder
    expect(isDismissed(r)).toBe(false)
  })
})

describe('isDue', () => {
  const baseReminder = (over: Partial<Reminder> = {}): Reminder =>
    ({ id: 'r-1', task_id: 't-1', kind: 'relative', offset_minutes: 0, fire_at: 1000, delivered_at: null, dismissed_at: null, created_at: 1, deleted_at: null, ...over } as Reminder)

  it('is due when fired and task is live', () => {
    const r = baseReminder()
    expect(isDue(r, { completed_at: null, deleted_at: null }, 2000)).toBe(true)
  })

  it('is not due before fire_at', () => {
    const r = baseReminder()
    expect(isDue(r, { completed_at: null, deleted_at: null }, 500)).toBe(false)
  })

  it('is not due when dismissed', () => {
    const r = baseReminder({ dismissed_at: 2000 })
    expect(isDue(r, { completed_at: null, deleted_at: null }, 3000)).toBe(false)
  })

  it('is not due when task is completed', () => {
    const r = baseReminder()
    expect(isDue(r, { completed_at: 1500, deleted_at: null }, 2000)).toBe(false)
  })

  it('is not due when task is deleted', () => {
    const r = baseReminder()
    expect(isDue(r, { completed_at: null, deleted_at: 1500 }, 2000)).toBe(false)
  })

  it('is not due when reminder is deleted', () => {
    const r = baseReminder({ deleted_at: 1500 })
    expect(isDue(r, { completed_at: null, deleted_at: null }, 2000)).toBe(false)
  })
})

describe('snoozeUntil', () => {
  it('snoozes 10 minutes', () => {
    expect(snoozeUntil('10m', 1_000_000)).toBe(1_000_000 + 10 * 60_000)
  })

  it('snoozes 1 hour', () => {
    expect(snoozeUntil('1h', 1_000_000)).toBe(1_000_000 + 60 * 60_000)
  })

  it('snoozes to tomorrow at 09:00', () => {
    const now = new Date(2026, 10, 15, 14, 0).getTime()
    const result = snoozeUntil('tomorrow', now)
    const d = new Date(result)
    expect(d.getDate()).toBe(16)
    expect(d.getHours()).toBe(9)
  })
})

describe('offsetLabel', () => {
  it('labels zero as at due time', () => {
    expect(offsetLabel(0)).toBe('At due time')
  })

  it('labels minutes before', () => {
    expect(offsetLabel(-30)).toBe('30 minutes before')
  })

  it('labels one hour before', () => {
    expect(offsetLabel(-60)).toBe('1 hour before')
  })

  it('labels one day before', () => {
    expect(offsetLabel(-1440)).toBe('1 day before')
  })

  it('labels minutes after', () => {
    expect(offsetLabel(15)).toBe('15 minutes after')
  })

  it('handles null as zero', () => {
    expect(offsetLabel(null)).toBe('At due time')
  })
})

describe('deadlineOffsetLabel', () => {
  it('labels zero as on the deadline', () => {
    expect(deadlineOffsetLabel(0)).toBe('On the deadline')
  })

  it('labels 1 day before the deadline', () => {
    expect(deadlineOffsetLabel(-1440)).toBe('1 day before the deadline')
  })
})

describe('reminderLabel', () => {
  it('labels a relative reminder', () => {
    expect(reminderLabel({ kind: 'relative', offset_minutes: -30, fire_at: null })).toBe('30 minutes before')
  })

  it('labels a deadline reminder', () => {
    expect(reminderLabel({ kind: 'deadline', offset_minutes: 0, fire_at: null })).toBe('On the deadline')
  })

  it('labels an absolute reminder by time', () => {
    const ms = new Date(2026, 10, 15, 10, 30).getTime()
    expect(reminderLabel({ kind: 'absolute', offset_minutes: null, fire_at: ms })).toContain('10:30')
  })

  it('returns Not scheduled when absolute has no fire_at', () => {
    expect(reminderLabel({ kind: 'absolute', offset_minutes: null, fire_at: null })).toBe('Not scheduled')
  })
})

describe('presets', () => {
  it('relative presets include at due time and 30 minutes before', () => {
    const labels = RELATIVE_PRESETS.map((p) => p.label)
    expect(labels).toContain('At due time')
    expect(labels).toContain('30 minutes before')
  })

  it('deadline presets include on the deadline', () => {
    const labels = DEADLINE_PRESETS.map((p) => p.label)
    expect(labels).toContain('On the deadline')
  })

  it('relative presets are sorted from zero to more negative', () => {
    const minutes = RELATIVE_PRESETS.map((p) => p.minutes)
    expect(minutes).toEqual([0, -10, -30, -60, -1440])
  })
})