// App-wide display formats: dates as "17 Nov 2026", date-times as "17 Nov 2026, 02:30 PM" (12-hour with
// AM/PM), in the viewer's local time zone. Built from Intl parts so the order and the AM/PM casing don't
// depend on the browser's locale. English month names, as the UI is English-only (ui-requirements §5.6).
const DISPLAY_LOCALE = 'en-US';

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, { day: '2-digit', month: 'short', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, { hour: '2-digit', minute: '2-digit', hour12: true });

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((part) => part.type === type)?.value ?? '';
}

// "dd MMM yyyy", e.g. 17 Nov 2026.
export function formatDate(isoDate: string): string {
    const parts = dateFormatter.formatToParts(new Date(isoDate));

    return `${getPart(parts, 'day')} ${getPart(parts, 'month')} ${getPart(parts, 'year')}`;
}

// "dd MMM yyyy, hh:mm AM/PM", e.g. 17 Nov 2026, 02:30 PM.
export function formatDateTime(isoDate: string): string {
    const parts = timeFormatter.formatToParts(new Date(isoDate));
    const time = `${getPart(parts, 'hour')}:${getPart(parts, 'minute')} ${getPart(parts, 'dayPeriod').toUpperCase()}`;

    return `${formatDate(isoDate)}, ${time}`;
}

// A calendar day the API already put in the viewer's time zone ("2026-11-17", e.g. a dashboard trend day):
// shown as that day, never shifted by a time zone again — so it's read and formatted as UTC.
const calendarDayFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

function calendarDayParts(day: string): Intl.DateTimeFormatPart[] {
    return calendarDayFormatter.formatToParts(new Date(`${day}T00:00:00Z`));
}

// "dd MMM yyyy" for a calendar day, e.g. 17 Nov 2026.
export function formatCalendarDay(day: string): string {
    const parts = calendarDayParts(day);

    return `${getPart(parts, 'day')} ${getPart(parts, 'month')} ${getPart(parts, 'year')}`;
}

// "dd MMM" for a calendar day — a chart axis, where the year is in the range above it.
export function formatCalendarDayShort(day: string): string {
    const parts = calendarDayParts(day);

    return `${getPart(parts, 'day')} ${getPart(parts, 'month')}`;
}
