import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AWAY_MS, awayFrom, pausePomodoroAt, pauseStopwatchAt } from '../src/site/siteAlive.js'

const NOW = 1_800_000_000_000

test('site counts as closed only after a gap longer than AWAY_MS', () => {
  assert.equal(awayFrom(NOW - AWAY_MS - 1, NOW), NOW - AWAY_MS - 1)
  // reload, tab switch or a throttled background tab
  assert.equal(awayFrom(NOW - 3000, NOW), null)
  assert.equal(awayFrom(NOW - AWAY_MS, NOW), null)
  // no record yet (first visit) or a clock moved back: unknown, do not pause
  assert.equal(awayFrom(0, NOW), null)
  assert.equal(awayFrom(NaN, NOW), null)
  assert.equal(awayFrom(NOW + 60_000, NOW), null)
})

test('running pomodoro pauses with the time left when the site closed', () => {
  const t = { preset: '25-5', phase: 'focus', remaining: 1500, running: true, endAt: NOW + 600_000 }
  assert.deepEqual(pausePomodoroAt(t, NOW, 1500), { ...t, running: false, endAt: 0, remaining: 600 })
  // last beat slightly before the start: never more than the phase length
  assert.equal(pausePomodoroAt(t, NOW - 1_000_000, 1500).remaining, 1500)
})

test('pomodoro is left alone when paused or when its phase already ended', () => {
  const paused = { preset: '25-5', phase: 'focus', remaining: 700, running: false, endAt: 0 }
  assert.equal(pausePomodoroAt(paused, NOW, 1500), paused)
  const ended = { preset: '25-5', phase: 'focus', remaining: 0, running: true, endAt: NOW - 1 }
  assert.equal(pausePomodoroAt(ended, NOW, 1500), ended)
})

test('running stopwatch keeps only the time until the site closed', () => {
  const s = { running: true, startedAt: NOW - 120_000, base: 30_000, credited: 2 }
  assert.deepEqual(pauseStopwatchAt(s, NOW), { running: false, startedAt: 0, base: 150_000, credited: 2 })
  assert.equal(pauseStopwatchAt(s, NOW - 500_000).base, 30_000)
  const stopped = { running: false, startedAt: 0, base: 5000, credited: 0 }
  assert.equal(pauseStopwatchAt(stopped, NOW), stopped)
})
