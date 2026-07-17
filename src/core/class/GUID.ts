import DateTime from './DateTime';

/**
 * Represents a globally unique identifier (GUID/UUID v4).
 * Provides methods for generation, validation, comparison, and formatting.
 */
export default class GUID {
    /**
     * The internal string value of the GUID.
     */
    private readonly value: string;

    /**
     * Creates a new GUID instance.
     * @param value Optional value to assign as the GUID.
     * @private Use `GUID.from()` or `new Guid()` instead of calling directly with a value.
     */
    constructor(value?: string) {
        this.value = value ?? GUID.new();
    }

    /**
     * Generates a new standard UUID v4 (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).
     * @returns A valid UUID string.
     */
    public static new(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Generates a compact UUID string (32 characters, no dashes).
     * @returns A UUID without dashes.
     */
    public static compact(): string {
        return GUID.new().replace(/-/g, '');
    }

    /**
     * Generates a timestamped UUID string in the format: yyyyMMddHHmmssfff-XXXXXXXXXXXX
     * (timestamp + first 12 characters of a compact UUID).
     * @returns A timestamp-prefixed UUID.
     */
    public static timestamped(): string {
        const now = DateTime.now.toString('yyyyMMddHHmmssfff');
        return `${now}-${GUID.compact().slice(0, 12)}`;
    }

    /**
     * Checks if a given string is a valid UUID (standard or compact).
     * @param guid The string to validate.
     * @returns `true` if the string is a valid UUID, otherwise `false`.
     */
    public static isValid(guid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const compactRegex = /^[0-9a-f]{32}$/i;
        return uuidRegex.test(guid) || compactRegex.test(guid);
    }

    /**
     * Creates a `Guid` instance from an existing UUID string.
     * @param guid The string representing a UUID.
     * @returns A `Guid` instance wrapping the given string.
     * @throws If the string is not a valid UUID.
     */
    public static from(guid: string): GUID {
        if (!this.isValid(guid)) {
            throw new Error(`Invalid GUID format: ${guid}`);
        }
        return new GUID(guid);
    }

    /**
     * Returns an instance representing the empty UUID:
     * `00000000-0000-0000-0000-000000000000`
     * @returns An empty `Guid` instance.
     */
    public static empty(): GUID {
        return new GUID('00000000-0000-0000-0000-000000000000');
    }

    /**
     * Checks whether this GUID instance is empty.
     * @returns `true` if the GUID is the empty value.
     */
    public isEmpty(): boolean {
        return this.value === '00000000-0000-0000-0000-000000000000';
    }

    /**
     * Returns the string representation of the GUID.
     * @returns The GUID as a string.
     */
    public toString(): string {
        return this.value;
    }

    /**
     * Returns the primitive value of the GUID for comparisons or string coercion.
     * @returns The GUID string.
     */
    public valueOf(): string {
        return this.value;
    }

    /**
     * Compares this GUID with another one for equality.
     * @param other The other `Guid` instance to compare.
     * @returns `true` if both GUIDs are equal.
     */
    public equals(other: GUID): boolean {
        return this.value === other.valueOf();
    }
}
