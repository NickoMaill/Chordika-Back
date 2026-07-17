import { TimeZoneEnum } from '~/types/typeCore';

export default class DateTime {
    /**
     * @description Returns the date converted to the instance's timezone.
     * @returns {Date} The date in the specified timezone.
     */
    private get Value(): Date {
        return this.convertToTimeZone();
    }
    private InitDate: Date;
    private static GlobalTimeZone: TimeZoneEnum = TimeZoneEnum.Europe_Paris;
    private TimeZone: TimeZoneEnum;
    private Locale: string = 'fr-FR';

    /**
     * @description Creates a new DateTime instance.
     * @param {string | Date | number[] | number | undefined} dateString - The date as a string (optional).
     * @param {TimeZoneEnum} [timeZone] - The timezone (optional).
     */
    constructor(source?: string | Date | number[] | number, timeZone?: TimeZoneEnum) {
        if (source) {
            if (typeof source === 'string') {
                this.InitDate = source ? new Date(source) : new Date();
            } else if (Array.isArray(source)) {
                if (source.length !== 3) throw new Error('DateTime must have 3 values');
                this.InitDate = new Date(source[0], source[1] - 1, source[2]);
            } else if (source instanceof Date) {
                this.InitDate = source;
            } else if (typeof source === 'number') {
                this.InitDate = new Date(source);
            }
        } else {
            this.InitDate = new Date();
        }
        this.TimeZone = timeZone || DateTime.GlobalTimeZone;
    }

    /**
     * @description Sets the global timezone.
     * @param {TimeZoneEnum} timeZone - The new global timezone.
     */
    public static setGlobalTimeZone(timeZone: TimeZoneEnum): void {
        DateTime.GlobalTimeZone = timeZone;
    }

    /**
     * @description Gets the current global timezone.
     * @returns {string} The current global timezone.
     */
    public static getGlobalTimeZone(): string {
        return DateTime.GlobalTimeZone;
    }

    /**
     * @description Sets a specific timezone for this instance.
     * @param {TimeZoneEnum} timeZone - The timezone to set for this instance.
     * @returns {DateTime} A new DateTime instance with the updated timezone.
     */
    public setTimeZone(timeZone: TimeZoneEnum): DateTime {
        this.TimeZone = timeZone;
        return this;
    }

    /**
     * @description Converts the date to the instance's timezone.
     * @returns {Date} The converted date.
     */
    private convertToTimeZone(): Date {
        if (isNaN(this.InitDate.getTime())) {
            return new Date();
        }

        const safeTimeZone = this.TimeZone || 'UTC';
        const parts = new Intl.DateTimeFormat(this.Locale, {
            timeZone: safeTimeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(this.InitDate);

        const year = parts.find((p) => p.type === 'year')?.value || '1970';
        const month = parts.find((p) => p.type === 'month')?.value.padStart(2, '0') || '01';
        const day = parts.find((p) => p.type === 'day')?.value.padStart(2, '0') || '01';
        const hour = parts.find((p) => p.type === 'hour')?.value.padStart(2, '0') || '00';
        const minute = parts.find((p) => p.type === 'minute')?.value.padStart(2, '0') || '00';
        const second = parts.find((p) => p.type === 'second')?.value.padStart(2, '0') || '00';

        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
    }

    /**
     * @description Adds a number of days to the date.
     * @param {number} d - The number of days to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addDays(d: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setDate(newDate.getDate() + d);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Adds a number of months to the date.
     * @param {number} m - The number of months to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addMonth(m: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setMonth(newDate.getMonth() + m);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Adds a number of years to the date.
     * @param {number} y - The number of years to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addYears(y: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setFullYear(newDate.getFullYear() + y);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Adds a number of hours to the date.
     * @param {number} h - The number of hours to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addHours(h: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setHours(newDate.getHours() + h);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Adds a number of minutes to the date.
     * @param {number} m - The number of minutes to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addMinutes(m: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setMinutes(newDate.getMinutes() + m);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Adds a number of seconds to the date.
     * @param {number} s - The number of seconds to add.
     * @returns {DateTime} A new DateTime instance with the updated date.
     */
    public addSeconds(s: number): DateTime {
        const newDate = new Date(this.Value);
        newDate.setSeconds(newDate.getSeconds() + s);
        return new DateTime(newDate.toISOString(), this.TimeZone);
    }

    /**
     * @description Get current Datetime
     */
    public static get now(): DateTime {
        return new DateTime();
    }

    /**
     * @description Checks if a given string is a valid date in 'yyyy-MM-dd' format.
     * @param {unknown} value - The value to check.
     * @returns {boolean} True if the string is a valid date in the correct format.
     */
    public static test(value: unknown): boolean {
        if (typeof value !== 'string') return false;

        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(value)) return false;

        const [year, month, day] = value.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
        );
    }
    /**
     * @param {string} format template format to return
     * @description Format DateTime from given format template
     * Supported format :
     * - yyyy : 4-digit year
     * - yy   : 2-digit year
     * - MMM  : Abbreviated month name (e.g., "Jan", "Feb")
     * - MMMM : Full month name (e.g., "January", "February")
     * - MM   : 2-digit month
     * - dddd : Full day name (e.g., "Monday")
     * - ddd  : Abbreviated day name (e.g., "Mon")
     * - dd   : 2-digit day
     * - HH   : 2-digit hours (24-hour format)
     * - hh   : 2-digit hours (12-hour format)
     * - mm   : 2-digit minutes
     * - ss   : 2-digit seconds
     * - fff  : 3-digit milliseconds
     * - tt   : AM/PM (e.g., "AM" or "PM")
     * - z    : Short timezone offset (e.g., "+1")
     * - zz   : Long timezone offset (e.g., "+01")
     * - zzz  : Offset with minutes (e.g., "+01:00")
     * - o    : Full ISO 8601 format
     * - s    : Simplified ISO 8601 format
     */
    public toString(format: string = 'yyyy-MM-ddTHH:mm:ss:fff'): string {
        const pad = (n: number, width: number = 2): string => n.toString().padStart(width, '0');

        const hours12 = this.Value.getHours() % 12 || 12;
        const ampm = this.Value.getHours() < 12 ? 'AM' : 'PM';

        const offsetMinutes = this.Value.getTimezoneOffset();
        const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
        const offsetMins = Math.abs(offsetMinutes) % 60;
        const offsetSign = offsetMinutes > 0 ? '-' : '+';
        const timeZoneOffsetShort = `${offsetSign}${offsetHours}`;
        const timeZoneOffsetLong = `${offsetSign}${pad(offsetHours)}`;
        const timeZoneOffsetFull = `${offsetSign}${pad(offsetHours)}:${pad(offsetMins)}`;

        const replacements: { [key: string]: string } = {
            yyyy: this.Value.getFullYear().toString(),
            yy: this.Value.getFullYear().toString().slice(-2),
            MMMM: new Intl.DateTimeFormat(this.Locale, { month: 'long' }).format(this.Value),
            MMM: new Intl.DateTimeFormat(this.Locale, { month: 'short' }).format(this.Value),
            MM: pad(this.Value.getMonth() + 1),
            dddd: new Intl.DateTimeFormat(this.Locale, { weekday: 'long' }).format(this.Value),
            ddd: new Intl.DateTimeFormat(this.Locale, { weekday: 'short' }).format(this.Value),
            dd: pad(this.Value.getDate()),
            HH: pad(this.Value.getHours()),
            hh: pad(hours12),
            mm: pad(this.Value.getMinutes()),
            ss: pad(this.Value.getSeconds()),
            fff: pad(this.Value.getMilliseconds(), 3),
            ffff: pad(this.Value.getMilliseconds(), 4),
            fffff: pad(this.Value.getMilliseconds(), 5),
            tt: ampm,
            z: timeZoneOffsetShort,
            zz: timeZoneOffsetLong,
            zzz: timeZoneOffsetFull,
            o: this.Value.toISOString(),
            s: this.Value.toISOString().split('.')[0],
        };

        return format.replace(/yyyy|yy|MMMM|MMM|MM|dddd|ddd|dd|HH|hh|mm|ss|fff|tt|z{1,3}|o|s/g, (match) => replacements[match]);
    }

    /**
     *
     * @param {string} l Local to assign
     * @returns {DateTime} The current instance with changed locale
     */
    public locale(l: string): DateTime {
        this.Locale = l;
        return this;
    }

    /**
     * @description Gets the timestamp in milliseconds since 1970.
     * @returns {number} The timestamp in milliseconds.
     */
    public getTime(): number {
        return this.Value.getTime();
    }

    /**
     * @description Returns the underlying Date object.
     * @returns {Date} The Date object.
     */
    public toDate(): Date {
        return this.Value;
    }

    /**
     * @description Checks if this date is before another date.
     * @param {DateTime} date - The date to compare with.
     * @returns {boolean} True if this date is before the given date.
     */
    public isBefore(date: DateTime): boolean {
        return this.Value.getTime() < date.getTime();
    }

    /**
     * @description Checks if this date is after another date.
     * @param {DateTime} date - The date to compare with.
     * @returns {boolean} True if this date is after the given date.
     */
    public isAfter(date: DateTime): boolean {
        return this.Value.getTime() > date.getTime();
    }

    /**
     * @description Calculates the difference in years between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of years between the two dates.
     */
    public yearsBetween(date: DateTime): number {
        const otherDate = date.convertToTimeZone();
        return Math.abs(this.Value.getFullYear() - otherDate.getFullYear());
    }

    /**
     * @description Calculates the difference in months between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of months between the two dates.
     */
    public monthsBetween(date: DateTime): number {
        const otherDate = date.convertToTimeZone();

        return Math.abs((this.Value.getFullYear() - otherDate.getFullYear()) * 12 + (this.Value.getMonth() - otherDate.getMonth()));
    }

    /**
     * @description Calculates the difference in days between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of days between the two dates.
     */
    public daysBetween(date: DateTime): number {
        const diff = this.Value.getTime() - date.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    /**
     * @description Calculates the difference in hours between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of hours between the two dates.
     */
    public hoursBetween(date: DateTime): number {
        const diff = this.Value.getTime() - date.getTime();
        return Math.floor(diff / (1000 * 60 * 60));
    }

    /**
     * @description Calculates the difference in minutes between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of minutes between the two dates.
     */
    public minutesBetween(date: DateTime): number {
        const diff = this.Value.getTime() - date.getTime();
        return Math.floor(diff / (1000 * 60));
    }

    /**
     * @description Calculates the difference in seconds between two dates.
     * @param {DateTime} date - The date to compare with.
     * @returns {number} The number of seconds between the two dates.
     */
    public secondesBetween(date: DateTime): number {
        const diff = this.Value.getTime() - date.getTime();
        return Math.floor(diff / 1000);
    }

    /**
     * @description Checks if the current date is today.
     * @returns {boolean} True if the date is today.
     */
    public isToday(): boolean {
        return this.toString('yyyy-MM-dd') === new DateTime().toString('yyyy-MM-dd');
    }

    /**
     * @description Checks if the current date falls on a weekend.
     * @returns {boolean} True if the date is a Saturday or Sunday.
     */
    public isWeekend(): boolean {
        const day = this.Value.getDay();
        return day === 0 || day === 6;
    }

    /**
     * @description Converts the date to a specific timezone.
     * @param {TimeZoneEnum} timeZone - The target timezone.
     * @returns {DateTime} A new DateTime instance in the specified timezone.
     */
    public toTimeZone(timeZone: TimeZoneEnum): DateTime {
        return new DateTime(this.toString('yyyy-MM-ddTHH:mm:ss'), timeZone);
    }

    /**
     * @description Gets the first day of the current month.
     * @returns {DateTime} A new DateTime instance set to the first day of the month.
     */
    public firstDayOfMonth(): DateTime {
        return new DateTime(`${this.toString('yyyy-MM')}-01`, this.TimeZone);
    }

    /**
     * @description Gets the last day of the current month.
     * @returns {DateTime} A new DateTime instance set to the last day of the month.
     */
    public lastDayOfMonth(): DateTime {
        const nextMonth = new Date(this.Value.getFullYear(), this.Value.getMonth() + 1, 0);
        return new DateTime(nextMonth.toISOString().split('T')[0], this.TimeZone);
    }

    /**
     * @description Checks if the current year is a leap year.
     * @returns {boolean} True if the year is a leap year.
     */
    public isLeapYear(): boolean {
        const year = this.Value.getFullYear();
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    /**
     * @description Converts the date to an ISO string format.
     * @returns {string} The ISO-formatted date string.
     */
    public formatISO(): string {
        return this.convertToTimeZone().toISOString();
    }

    /**
     * @description Converts the date to a JSON string format.
     * @returns {string} The JSON-formatted date string.
     */
    public toJSON(): string {
        return this.formatISO();
    }
    /**
     * @description Converts the date to a string format.
     * @returns {string} The string representation of the date.
     */
    public valueOf(): number {
        return this.getTime();
    }

    /**
     * @description Checks if the current date is equal to another date.
     * @param {DateTime} other - The date to compare with.
     * @returns {boolean} True if the dates are equal.
     */
    public equals(other: DateTime): boolean {
        return this.getTime() === other.getTime();
    }

    /**
     * @description Checks if the current date is not equal to another date.
     * @param {DateTime} other - The date to compare with.
     * @returns {boolean} True if the dates are not equal.
     */
    public notEquals(other: DateTime): boolean {
        return !this.equals(other);
    }
    /**
     * @description Creates an exact copy of the current DateTime instance.
     * @returns {DateTime} A cloned instance of the DateTime object.
     */
    public clone(): DateTime {
        return new DateTime(this.toString('yyyy-MM-ddTHH:mm:ss'), this.TimeZone as TimeZoneEnum);
    }
}
