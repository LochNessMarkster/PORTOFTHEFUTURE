
/**
 * Time utilities for session scheduling and conflict detection
 */

/**
 * Parse a time string (e.g., "9:00 AM", "2:30 PM") into minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  
  const trimmed = timeStr.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  
  if (!match) return 0;
  
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
}

/**
 * Check if a session is currently happening
 */
export function isSessionNow(date: string, startTime: string, endTime: string): boolean {
  const now = new Date();
  const sessionDate = new Date(date);
  
  // Check if same date
  if (
    sessionDate.getFullYear() !== now.getFullYear() ||
    sessionDate.getMonth() !== now.getMonth() ||
    sessionDate.getDate() !== now.getDate()
  ) {
    return false;
  }
  
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  
  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

/**
 * Check if a session is coming up next (within 30 minutes)
 */
export function isSessionNext(date: string, startTime: string): boolean {
  const now = new Date();
  const sessionDate = new Date(date);
  
  // Check if same date
  if (
    sessionDate.getFullYear() !== now.getFullYear() ||
    sessionDate.getMonth() !== now.getMonth() ||
    sessionDate.getDate() !== now.getDate()
  ) {
    return false;
  }
  
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(startTime);
  
  // Session starts within the next 30 minutes
  const minutesUntilStart = startMinutes - nowMinutes;
  return minutesUntilStart > 0 && minutesUntilStart <= 30;
}

/**
 * Check if two sessions overlap
 */
export function sessionsOverlap(
  date1: string,
  start1: string,
  end1: string,
  date2: string,
  start2: string,
  end2: string
): boolean {
  // Must be same date
  if (date1 !== date2) return false;
  
  const start1Minutes = parseTimeToMinutes(start1);
  const end1Minutes = parseTimeToMinutes(end1);
  const start2Minutes = parseTimeToMinutes(start2);
  const end2Minutes = parseTimeToMinutes(end2);
  
  // Check if time ranges overlap
  // Overlap occurs if: start1 < end2 AND start2 < end1
  return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

/**
 * Get the session status label
 */
export function getSessionStatus(date: string, startTime: string, endTime: string): 'now' | 'next' | null {
  if (isSessionNow(date, startTime, endTime)) {
    return 'now';
  }
  if (isSessionNext(date, startTime)) {
    return 'next';
  }
  return null;
}
