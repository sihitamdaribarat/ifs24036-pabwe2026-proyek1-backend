export function getUserDate(timezone = 'Asia/Jakarta', offsetDays = 0) {
  try {
    const now = new Date();
    if (offsetDays !== 0) {
      now.setDate(now.getDate() + offsetDays);
    }
    // Formatter using parts for YYYY-MM-DD
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // en-CA gives YYYY-MM-DD
  } catch (err) {
    // Fallback to UTC if invalid timezone
    const now = new Date();
    if (offsetDays !== 0) {
      now.setDate(now.getDate() + offsetDays);
    }
    return now.toISOString().slice(0, 10);
  }
}

export function getUserToday(timezone = 'Asia/Jakarta') {
  return getUserDate(timezone, 0);
}

export function getUserYesterday(timezone = 'Asia/Jakarta') {
  return getUserDate(timezone, -1);
}

export function isLogDateAllowed(logDate, timezone = 'Asia/Jakarta') {
  const today = getUserToday(timezone);
  const yesterday = getUserYesterday(timezone);
  return logDate === today || logDate === yesterday;
}

export function isValidIanaTimezone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (e) {
    return false;
  }
}
