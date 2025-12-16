import { Entry } from '../models/entry.model';

export function generateOccurrences(
  entry: Entry,
  startDate: Date,
  endDate: Date
): Date[] {
  const occurrences: Date[] = [];

  if (entry.repeatType === 'monthly') {
    if (entry.dayOfMonth === undefined) {
      return occurrences;
    }

    let currentDate = new Date(startDate);
    currentDate.setDate(1);

    while (currentDate <= endDate) {
      const occurrence = new Date(currentDate);
      occurrence.setDate(Math.min(entry.dayOfMonth, getDaysInMonth(occurrence)));

      if (occurrence >= startDate && occurrence <= endDate) {
        occurrences.push(new Date(occurrence));
      }

      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else if (entry.repeatType === 'weekly' || entry.repeatType === 'biweekly') {
    if (!entry.startDate) {
      return occurrences;
    }

    const entryStartDate = new Date(entry.startDate);
    const intervalDays = entry.repeatType === 'weekly' ? 7 : 14;

    let currentDate = new Date(entryStartDate);

    while (currentDate < startDate) {
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
  if (entry.repeatType === 'monthly') {
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

    const entryStartDate = new Date(entry.startDate);
    const intervalDays = entry.repeatType === 'weekly' ? 7 : 14;

    let nextDate = new Date(entryStartDate);

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
