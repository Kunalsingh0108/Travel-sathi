/** Time helpers. All times are "HH:MM" strings or minutes-from-midnight integers. */

export function parseTime(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return NaN;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return NaN;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return NaN;
  return h * 60 + m;
}

export function formatTime(minutes) {
  const safe = Math.max(0, Math.round(minutes));
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutes(time, minutes) {
  return parseTime(time) + minutes;
}

const MS_DAY = 86400000;

function toUTC(value) {
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  return toUTC(value) !== null;
}

export function addDays(dateStr, days) {
  const d = toUTC(dateStr);
  if (!d) return null;
  return new Date(d.getTime() + days * MS_DAY).toISOString().slice(0, 10);
}

export function diffDays(startStr, endStr) {
  const a = toUTC(startStr);
  const b = toUTC(endStr);
  if (!a || !b) return NaN;
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

/** Returns ["YYYY-MM-DD", ...] inclusive of both ends. */
export function dateRange(startStr, endStr) {
  const total = diffDays(startStr, endStr);
  if (Number.isNaN(total) || total < 0) return [];
  const out = [];
  for (let i = 0; i <= total; i += 1) out.push(addDays(startStr, i));
  return out;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayOf(dateStr) {
  const d = toUTC(dateStr);
  if (!d) return '';
  return WEEKDAYS[d.getUTCDay()];
}

export function weekdayIndex(dateStr) {
  const d = toUTC(dateStr);
  if (!d) return -1;
  return d.getUTCDay();
}

export function formatDate(dateStr, { long = false } = {}) {
  const d = toUTC(dateStr);
  if (!d) return '';
  const month = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][d.getUTCMonth()];
  return long ? `${d.getUTCDate()} ${month} ${d.getUTCFullYear()}` : `${d.getUTCDate()} ${month}`;
}
