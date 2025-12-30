import { Entry } from '../models/entry.model';

export function generateOccurrences(
  entry: Entry,
  startDate: Date,
  endDate: Date
): Date[] {
  const occurrences: Date[] = [];

  // For recurring entries, limit to creation date or later
  let effectiveStartDate = new Date(startDate);

  if (entry.repeatType !== 'once') {
    // Use entry creation date as the earliest bound for recurring entries
    const createdAt = fromUTC(new Date(entry.createdAt));
    effectiveStartDate = new Date(Math.max(startDate.getTime(), createdAt.getTime()));
  }

  if (entry.repeatType === 'once') {
    // One-time entry on a specific date
    if (!entry.specificDate) {
      return occurrences;
    }

    const specificDate = fromUTC(new Date(entry.specificDate));

    if (specificDate >= startDate && specificDate <= endDate) {
      occurrences.push(specificDate);
    }
  } else if (entry.repeatType === 'monthly') {
    if (entry.dayOfMonth === undefined) {
      return occurrences;
    }

    const currentDate = new Date(effectiveStartDate);
    currentDate.setDate(1);

    while (currentDate <= endDate) {
      const occurrence = new Date(currentDate);
      occurrence.setDate(Math.min(entry.dayOfMonth, getDaysInMonth(occurrence)));

      if (occurrence >= effectiveStartDate && occurrence <= endDate) {
        occurrences.push(new Date(occurrence));
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (entry.repeatType === 'weekly' || entry.repeatType === 'biweekly') {
    if (!entry.startDate) {
      return occurrences;
    }

    // Convert UTC startDate to local timezone
    const entryStartDate = fromUTC(new Date(entry.startDate));
    const intervalDays = entry.repeatType === 'weekly' ? 7 : 14;

    const currentDate = new Date(entryStartDate);

    // Skip forward to first occurrence >= effectiveStartDate
    while (currentDate < effectiveStartDate) {
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }

    while (currentDate <= endDate) {
      occurrences.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + intervalDays);
    }
  }

  return occurrences;
}

export function getNextOccurrence(entry: Entry, fromDate: Date): Date {
  if (entry.repeatType === 'once') {
    // One-time entries don't have a "next" occurrence
    if (!entry.specificDate) {
      return fromDate;
    }
    return fromUTC(new Date(entry.specificDate));
  } else if (entry.repeatType === 'monthly') {
    if (entry.dayOfMonth === undefined) {
      return fromDate;
    }

    const nextDate = new Date(fromDate);
    nextDate.setDate(entry.dayOfMonth);

    if (nextDate <= fromDate) {
      nextDate.setMonth(nextDate.getMonth() + 1);
      nextDate.setDate(Math.min(entry.dayOfMonth, getDaysInMonth(nextDate)));
    }

    return nextDate;
  } else if (entry.repeatType === 'weekly' || entry.repeatType === 'biweekly') {
    if (!entry.startDate) {
      return fromDate;
    }

    // Convert UTC startDate to local timezone
    const entryStartDate = fromUTC(new Date(entry.startDate));
    const intervalDays = entry.repeatType === 'weekly' ? 7 : 14;

    const nextDate = new Date(entryStartDate);

    while (nextDate <= fromDate) {
      nextDate.setDate(nextDate.getDate() + intervalDays);
    }

    return nextDate;
  }

  return fromDate;
}

export function formatDateForDisplay(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return date.toLocaleDateString('en-US', options);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Convert UTC date to local timezone
 * Takes a UTC Date object and returns a Date in the user's local timezone
 */
export function fromUTC(utcDate: Date): Date {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    0, 0, 0, 0
  );
}

/**
 * Convert local date to UTC
 * Takes a local Date and returns a UTC Date object
 */
export function toUTC(localDate: Date): Date {
  return new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  ));
}
