
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
 * Normalize a date string to YYYY-MM-DD format for consistent comparison
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse and convert to YYYY-MM-DD
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.warn('[timeUtils] Invalid date string:', dateStr);
    return dateStr;
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Normalize a time string to a consistent format for comparison
 * Converts "9:00 AM", "09:00 AM", etc. to minutes since midnight
 */
export function normalizeTime(timeStr: string): number {
  return parseTimeToMinutes(timeStr);
}

/**
 * Check if two sessions have the EXACT same date and start time
 * This is the conflict rule: same date + same start time = conflict
 */
export function hasSameStartTime(
  date1: string,
  startTime1: string,
  date2: string,
  startTime2: string
): boolean {
  console.log('[timeUtils] Comparing sessions:');
  console.log('  Session 1 - Date:', date1, 'Start:', startTime1);
  console.log('  Session 2 - Date:', date2, 'Start:', startTime2);
  
  // Normalize dates for comparison
  const normalizedDate1 = normalizeDate(date1);
  const normalizedDate2 = normalizeDate(date2);
  
  console.log('  Normalized dates:', normalizedDate1, 'vs', normalizedDate2);
  
  // Must be same date
  if (normalizedDate1 !== normalizedDate2) {
    console.log('  ❌ Different dates - no conflict');
    return false;
  }
  
  // Normalize start times to minutes for comparison
  const normalizedStart1 = normalizeTime(startTime1);
  const normalizedStart2 = normalizeTime(startTime2);
  
  console.log('  Normalized start times (minutes):', normalizedStart1, 'vs', normalizedStart2);
  
  // Check if start times are identical
  const hasConflict = normalizedStart1 === normalizedStart2;
  
  console.log(hasConflict ? '  ✅ CONFLICT DETECTED - Same date and start time!' : '  ❌ Different start times - no conflict');
  
  return hasConflict;
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
 * Check if two sessions overlap (time range overlap)
 * NOTE: This is different from hasSameStartTime - this checks if time ranges overlap
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
