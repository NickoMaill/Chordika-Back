import DateTime from './DateTime';
import GUID from './GUID';
import jwt from 'jsonwebtoken';
import { StandardError } from './standardError';
import configManager from '~/managers/configManager';
import { TokenTypeEnum } from '~/types/typeCore';

/**
 * Static utility class for common one-shot validations.
 * Can be used for basic checks like email, UUID, emptiness, or number-like values.
 */
export default class Validator {
    /**
     * Starts a fluent validation chain for a given value.
     * @param value The value to validate.
     * @returns A fluent ValidatorCheck instance.
     */
    public static check<T>(value: T): ValidatorCheck<T> {
        return new ValidatorCheck<T>(value);
    }

    /**
     * Checks if a string is a valid email address.
     * @param str The string to test.
     * @returns True if valid, false otherwise.
     */
    public static isEmail(str: string): boolean {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(str);
    }

    /**
     * Checks if a string is a valid UUID (standard or compact).
     * @param str The string to test.
     * @returns True if valid UUID, false otherwise.
     */
    public static isUUID(str: string): boolean {
        return GUID.isValid(str);
    }

    /**
     * Checks if a value is empty: null, undefined, empty string, empty array or empty object.
     * @param obj The value to check.
     * @returns True if empty, false otherwise.
     */
    public static isEmpty(obj: any): boolean {
        if (obj === null) return true;
        if (typeof obj === 'string') return obj.trim() === '';
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    }

    /**
     * Checks if a value can be interpreted as a number.
     * @param str The value to check.
     * @returns True if number-like, false otherwise.
     */
    public static isNumberLike(str: any): boolean {
        return str !== null && str !== undefined && !isNaN(Number(str));
    }

    private static getSecret(type: TokenTypeEnum): string {
        switch (type) {
            case TokenTypeEnum.ACCESS:
                return configManager.getConfig.ACCESS_SECRET;
            case TokenTypeEnum.PROXY:
                return configManager.getConfig.SESSION_SECRET;
            default:
                return configManager.getConfig.SECRET_REFRESH;
                break;
        }
    }

    /**
     * Decode a jwt token
     * @param {string} token token to decode
     * @param {TokenTypeEnum} type type of the token to decode
     * @returns The payload in the token
     * @throws {StandardError} token_expired - Token is expired
     * @throws {StandardError} token_not_active - Token is before the nfb claim
     * @throws {StandardError} token_invalid - header or payload could not be parsed | invalid signature | malformed ... see https://www.npmjs.com/package/jsonwebtoken#jsonwebtokenerror
     */
    public static decodeToken<T>(token: string, type: TokenTypeEnum): T {
        let decoded: T = null;
        jwt.verify(token, this.getSecret(type), (err: jwt.JsonWebTokenError, dec: typeof decoded) => {
            if (err) {
                if (err) {
                    switch (err.name.toLowerCase()) {
                        case 'tokenexpirederror':
                            throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'token_expired', `token expired`, 'token provided is invalid');
                        case 'notbeforeerror':
                            throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'token_not_active', `token not active`, 'token provided is not active');
                        default:
                            throw new StandardError('adminManager.checkRefresh', 'FATAL', 'token_invalid', `token => ${token} invalid`, 'token invalid, message => ' + err.message);
                    }
                }
            }
            if (dec) {
                decoded = dec;
            }
        });
        return decoded;
    }

    /**
     * Check if token is valid
     * @param {string} token token to decode
     * @param {TokenTypeEnum} type type of the token to decode
     * @returns a boolean that says if token is valid or not
     */
    public static checkToken(token: string, type: TokenTypeEnum): boolean {
        try {
            this.decodeToken(token, type);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Encode a token with provided payload and expires
     * @param payload Payload to encode in token
     * @param type Type of token to encode
     * @param expires When the token will be expired (in minutes)
     * @returns a JSON Web Token
     */
    public static encodeToken(payload: object, type: TokenTypeEnum, expires: number): string {
        return jwt.sign(payload, this.getSecret(type), { expiresIn: `${expires}min` });
    }
}

/**
 * Fluent validation class to chain multiple validations on a value.
 * Use via `Validator.check(value).isEmail().isNotEmpty().result();`
 */
export class ValidatorCheck<T = any> {
    private value: T;
    private valid: boolean;

    /**
     * Internal constructor - use Validator.check(value) instead.
     * @param value The value to validate.
     */
    constructor(value: T) {
        this.value = value;
        this.valid = true;
    }

    /**
     * Internal condition evaluator. If the condition is false, validity is locked to false.
     * @param condition Boolean condition to apply.
     * @returns The current instance for chaining.
     */
    private test(condition: boolean): this {
        if (!condition) this.valid = false;
        return this;
    }

    /**
     * Validates if the value is a string matching email format.
     */
    public isEmail(): this {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return this.test(typeof this.value === 'string' && regex.test(this.value));
    }

    /**
     * Validates if the value is a UUID (standard or compact).
     */
    public isUUID(): this {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const compactRegex = /^[0-9a-f]{32}$/i;
        return this.test(typeof this.value === 'string' && (uuidRegex.test(this.value) || compactRegex.test(this.value)));
    }

    /**
     * Validates that the value is not empty: not null, not undefined,
     * not empty string, empty array or empty object.
     */
    public isNotEmpty(): this {
        const v = this.value;
        const condition = v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'object' && Object.keys(v).length === 0);
        return this.test(condition);
    }

    /**
     * Validates that the value is number-like (can be cast to a number).
     */
    public isNumberLike(): this {
        return this.test(this.value !== null && this.value !== undefined && !isNaN(Number(this.value)));
    }

    /**
     * Validates that a string or array has a given length.
     * @param min Minimum length (optional).
     * @param max Maximum length (optional).
     */
    public hasLength(min?: number, max?: number): this {
        if (this.value === null) return this.test(false);

        const length = typeof this.value === 'string' || Array.isArray(this.value) ? this.value.length : undefined;

        if (length === undefined) return this.test(false);
        if (min !== undefined && length < min) return this.test(false);
        if (max !== undefined && length > max) return this.test(false);

        return this;
    }

    /**
     * Validates if the value is a valid date (DateTime, Date, or ISO string).
     */
    public isDate(): this {
        try {
            if (this.value instanceof DateTime) {
                return this.test(!isNaN(this.value.getTime()));
            }

            if (this.value instanceof Date) {
                return this.test(!isNaN(this.value.getTime()));
            }

            if (typeof this.value === 'string') {
                const dt = new DateTime(this.value);
                return this.test(!isNaN(dt.getTime()));
            }

            return this.test(false);
        } catch {
            return this.test(false);
        }
    }

    /**
     * Validates that the value is included in the provided values.
     * @param values The allowed values.
     */
    public in(...values: T[]): this {
        return this.test(values.includes(this.value));
    }

    /**
     * Validates that a string starts with a specific prefix.
     * @param prefix The prefix to check.
     */
    public startsWith(prefix: string): this {
        return this.test(typeof this.value === 'string' && this.value.startsWith(prefix));
    }

    /**
     * Applies a custom validation function to the value.
     * @param fn A function returning true if the value is valid.
     */
    public custom(fn: (val: T) => boolean): this {
        return this.test(fn(this.value));
    }

    /**
     * Returns the final result of the validation chain.
     * @returns True if all validations passed.
     */
    public result(): boolean {
        return this.valid;
    }

    /**
     * Allows implicit boolean conversion.
     */
    public valueOf(): boolean {
        return this.valid;
    }
}
