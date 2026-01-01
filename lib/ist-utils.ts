/**
 * Sahakar Accounts IST Timing Helper
 */

/**
 * Returns the current date and time in Indian Standard Time (IST)
 */
export function getISTDate(): Date {
    const now = new Date();
    // Offset for IST (+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + istOffset);
}

/**
 * Returns the "Business Date" for Sahakar Accounts.
 * Business day starts at 07:00 AM IST and ends at 06:59 AM IST the next day.
 */
export function getBusinessDate(): string {
    const ist = getISTDate();
    const hour = ist.getHours();

    // If before 7 AM, it's still the previous day's business cycle
    if (hour < 7) {
        const yesterday = new Date(ist);
        yesterday.setDate(ist.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    return ist.toISOString().split('T')[0];
}

/**
 * Formats a date for the UI clock
 */
export function formatISTClock(date: Date) {
    const optionsDate: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    };

    return {
        dateStr: date.toLocaleDateString('en-IN', optionsDate),
        timeStr: date.toLocaleTimeString('en-IN', optionsTime)
    };
}

/**
 * Checks if current time is within valid business hours (07:00 - 02:00 next day)
 * Returns false if outside 7 AM to 2 AM.
 */
export function isWithinDutyHours(): boolean {
    const ist = getISTDate();
    const hour = ist.getHours();

    // Valid: 07:00 to 23:59 (7 to 23)
    // Valid: 00:00 to 01:59 (0 to 1)
    return (hour >= 7) || (hour < 2);
}
