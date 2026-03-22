/**
 * Date Utilities for Analytics
 * 
 * Helpers để xử lý date range cho analytics queries.
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get default date range (last 30 days)
 * 
 * Prevents heavy queries by defaulting to recent data.
 */
export function getDefaultDateRange(): DateRange {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  return { startDate, endDate };
}

/**
 * Validate and sanitize date range
 * 
 * Rules:
 * - Max range: 90 days (prevent excessive queries)
 * - startDate must be before endDate
 * - Dates cannot be in the future
 * 
 * @throws Error if validation fails
 */
export function validateDateRange(
  startDate?: Date,
  endDate?: Date
): DateRange {
  const now = new Date();

  // Use defaults if not provided
  if (!startDate && !endDate) {
    return getDefaultDateRange();
  }

  // Parse and validate
  const start = startDate ? new Date(startDate) : new Date(0); // Beginning of time if not specified
  const end = endDate ? new Date(endDate) : now;

  // Validate dates are valid
  if (isNaN(start.getTime())) {
    throw new Error('Invalid startDate format');
  }
  if (isNaN(end.getTime())) {
    throw new Error('Invalid endDate format');
  }

  // Validate logical constraints
  if (start > end) {
    throw new Error('startDate must be before endDate');
  }

  if (end > now) {
    throw new Error('endDate cannot be in the future');
  }

  // Validate max range (90 days)
  const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > 90) {
    throw new Error('Date range cannot exceed 90 days. Please use a smaller range.');
  }

  return { startDate: start, endDate: end };
}

/**
 * Format date range for response meta
 */
export function formatDateRangeMeta(dateRange: DateRange) {
  return {
    startDate: dateRange.startDate.toISOString(),
    endDate: dateRange.endDate.toISOString(),
    days: Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / 
      (1000 * 60 * 60 * 24)
    )
  };
}
