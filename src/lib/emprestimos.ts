export const loanLimit = 5;
export const loanBusinessDays = 14;

const timeZone = 'America/Sao_Paulo';
const dateLabel = new Intl.DateTimeFormat('pt-BR', {
  timeZone,
  dateStyle: 'short',
  timeStyle: 'short',
});

const localParts = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const nationalHolidays = new Set(['1-1', '4-21', '5-1', '9-7', '10-12', '11-2', '11-15', '11-20', '12-25']);

// Gregorian computus. The federal calendar lists Good Friday as a national holiday.
function goodFriday(year: number) {
  const golden = year % 19;
  const century = Math.floor(year / 100);
  const yearInCentury = year % 100;
  const lunar = (19 * golden + century - Math.floor(century / 4)
    - Math.floor((century - Math.floor((century + 8) / 25) + 1) / 3) + 15) % 30;
  const weekday = (32 + 2 * (century % 4) + 2 * Math.floor(yearInCentury / 4)
    - lunar - yearInCentury % 4) % 7;
  const easter = lunar + weekday - 7 * Math.floor((golden + 11 * lunar + 22 * weekday) / 451) + 114;
  return Date.UTC(year, Math.floor(easter / 31) - 1, easter % 31 - 1);
}

function civilTime(date: Date) {
  const parts = Object.fromEntries(localParts.formatToParts(date).map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second, date.getUTCMilliseconds());
}

export function dueDate(borrowedAt: Date) {
  const wallClock = new Date(civilTime(borrowedAt));
  for (let counted = 0; counted < loanBusinessDays;) {
    wallClock.setUTCDate(wallClock.getUTCDate() + 1);
    const weekday = wallClock.getUTCDay();
    const year = wallClock.getUTCFullYear();
    const month = wallClock.getUTCMonth();
    const day = wallClock.getUTCDate();
    if (weekday === 0 || weekday === 6 || nationalHolidays.has(`${month + 1}-${day}`)
      || Date.UTC(year, month, day) === goodFriday(year)) continue;
    counted++;
  }
  const offset = civilTime(borrowedAt) - borrowedAt.getTime();
  const candidate = new Date(wallClock.getTime() - offset);
  return new Date(candidate.getTime() + wallClock.getTime() - civilTime(candidate));
}

export function formatDueDate(date: Date) {
  return dateLabel.format(date);
}
