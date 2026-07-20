import { CookieOptions } from 'express';
import App from '~/core/appCore';
import { DatabaseCoreQuery, QuerySearch } from '~/types/coreApiTypes';
import configManager from '~/managers/configManager';
import StringBuilder from '~/core/class/StringBuilder';
import GUID from '~/core/class/GUID';
type ParsedQueryValue = string | number | boolean | null | undefined;

export class AppTools {
    public static emailRegex: RegExp = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    public static phoneRegex: RegExp = /^\+?(\d[\d-. ]+)?(\([\d-. ]+\))?[\d-. ]+\d$/;

    private static parseQueryValue(value: string): ParsedQueryValue {
        if (value === '') {
            return null;
        }

        if (typeof value !== 'string') {
            return value;
        }

        const trimmedValue = value.trim().split('¤')[0];
        const lowerValue = trimmedValue.toLowerCase();

        if (lowerValue === 'true') {
            return true;
        }

        if (lowerValue === 'false') {
            return false;
        }

        if (/^-?(0|[1-9]\d*)$/.test(trimmedValue)) {
            return Number.parseInt(trimmedValue, 10);
        }

        if (/^-?(0|[1-9]\d*)\.\d+$/.test(trimmedValue)) {
            return Number.parseFloat(trimmedValue);
        }

        return value;
    }
    public static parseQuery(queries: Record<string, string>): Record<string, ParsedQueryValue> {
        const result: Record<string, ParsedQueryValue> = { ...queries };

        for (const key of Object.keys(result)) {
            const value = this.parseQueryValue(result[key] as string);
            result[key] = value;
        }

        return result;
    }
    public static insertAt(array: any[], index: number, ...elementsArray: any[]): void {
        array.splice(index, 0, ...elementsArray);
    }

    public static Capitalize(str: string): string {
        return str
            .toLowerCase()
            .split('-')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
            .join('-')
            .split(' ')
            .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
            .join(' ');
    }

    public static TimeConvert(value: number): { sec: number; min: number; hour: number; day: number } {
        return {
            sec: value * 1000,
            min: value * 60 * 1000,
            hour: value * 60 * 60 * 1000,
            day: value * 24 * 60 * 60 * 1000,
        };
    }
    public static generateOtp(): string {
        const minCeiled = Math.ceil(100000);
        const maxFloored = Math.floor(999999);
        const opt = Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled).toString();
        return opt;
    }

    public static getDeviceId(): string {
        // const id = machineId.machineIdSync(true);
        // return id;

        return '';
    }

    public static generateUuid(): string {
        return GUID.new();
    }

    public static getCookieOptions(expires?: Date): CookieOptions {
        const options: CookieOptions = {
            httpOnly: true,
            secure: configManager.getConfig.HTTPS,
            sameSite: configManager.getConfig.HTTPS ? 'none' : 'lax',
            domain: configManager.getConfig.HTTPS ? 'maillols.freeboxos.fr' : 'localhost',
        };
        if (expires) {
            options.expires = expires;
        }
        return options;
    }

    public static buildDbQuery<T>(query: Record<string, unknown>, queryStruct: QuerySearch<T>[], baseQuery: DatabaseCoreQuery<T>): DatabaseCoreQuery<T> {
        const getIndex = (field: string): number => queryStruct.findIndex((q) => q.field === field);
        const out: DatabaseCoreQuery<T> = { ...baseQuery, where: { ...baseQuery.where } };

        for (const key in query) {
            switch (key.toLowerCase()) {
                case 'sort': {
                    const sort = (query[key] as string).split(',');
                    const isMultiSort = sort.length > 1;
                    if (isMultiSort) query.multiOrder = [];
                    sort.forEach((s) => {
                        const sorter = s.split(' ');
                        const index = getIndex(sorter[0]);
                        if (index > -1) {
                            if (isMultiSort) {
                                out.multiOrder.push({
                                    field: queryStruct[index].dbField as keyof T,
                                    asc: sorter[1].toLowerCase() === 'asc',
                                });
                            } else {
                                out.order = queryStruct[index].dbField as keyof T;
                                out.asc = sorter[1].toLowerCase() === 'asc';
                            }
                        }
                    });
                    break;
                }
                case 'limit':
                case 'offset': {
                    const numValue = Number(query[key]);
                    if (!isNaN(numValue)) {
                        out[key as 'limit' | 'offset'] = numValue;
                    }
                    break;
                }
                default: {
                    const fieldIndex = getIndex(key);
                    if (fieldIndex > -1) {
                        const founded = queryStruct[fieldIndex];
                        if (founded.typeWhere === 'LIKE' || founded.typeWhere === 'START') {
                            const clauseKey = founded.typeWhere.toLowerCase();
                            const value = (query[key] as string).split('¤')[0];
                            if (!out.where[clauseKey]) {
                                out.where[clauseKey] = {};
                            }
                            out.where[clauseKey][founded.dbField] = [value + (queryStruct[fieldIndex].caseSensitive ? "$" : "")]
                        } else {
                            if (!out.where.equals) {
                                out.where.equals = {};
                                out.where.lower = {};
                                out.where.lowerEquals = {};
                                out.where.upper = {};
                                out.where.upperEquals = {};
                            }

                            // | => UPPER
                            // @ => UPPER_EQUALS
                            // $ => LOWER
                            // £ => LOWER_EQUALS
                            const rawValue = query[key];
                            const firstLetter = rawValue?.toString().charAt(0);
                            const value = rawValue?.toString().split('¤')[0];
                            switch (firstLetter) {
                                case '|':
                                    out.where.upper[founded.dbField] = this.parseQueryValue(value.replace(firstLetter, ''));
                                    break;
                                case '@':
                                    out.where.upperEquals[founded.dbField] = this.parseQueryValue(value.replace(firstLetter, ''));
                                    break;
                                case '$':
                                    out.where.lower[founded.dbField] = this.parseQueryValue(value.replace(firstLetter, ''));
                                    break;
                                case '£':
                                    out.where.lowerEquals[founded.dbField] = this.parseQueryValue(value.replace(firstLetter, ''));
                                    break;
                                default:
                                    const values = rawValue?.toString().split(',');
                                    if (values.length > 1) {
                                        out.where.equals[founded.dbField] = values.map((v) => this.parseQueryValue(v));
                                    } else {
                                        out.where.equals[founded.dbField] = this.parseQueryValue(value);
                                    }
                                    break;
                            }
                        }
                    }
                    break;
                }
            }
        }
        return out;
    }

    public static mergeObject<T>(from: T, to: any): T {
        for (const key in from) {
            if (Object.keys(to).includes(key)) {
                from[key] = to[key];
            }
        }
        return from;
    }

    public static SetGenericActionLog(formField: string[], to: any, from: any = null): string {
        const result = new StringBuilder();
        formField.forEach((f) => {
            if (Object.keys(to).includes(f) && (from === null || from[f] !== to[f])) {
                result.append(`${f} : `);
                if (f.toLowerCase() === 'password') {
                    result.append('XXXXXX (XXXXXX)');
                } else {
                    result.append(`${to[f]}`);
                    if (from !== null) result.append(` (${from[f]})`);
                }
                result.append('\n');
            }
        });
        return result.toString();
    }

    // public static async getImageMetadata(buff: Buffer): Promise<MetadataProps> {
    //     const metadata = await sharp(buff).metadata();
    //     return {
    //         width: metadata.width,
    //         height: metadata.height,
    //         type: metadata.format,
    //         size: metadata.size,
    //     };
    // }

    public static removeDiacritics(str: string): string {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    public static async delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    public static normalizeFileName(str: string): string {
        return this.removeDiacritics(str)
            .split('.')[0]
            .toLowerCase()
            .replace(/[-\s*]+/g, '_')
            .replace(/[^\w.]/g, '')
            .replace(/_+/g, '_');
    }

    public static async getNextImportId(): Promise<number> {
        const params = await App.query("SELECT nextval('next_import_id')");
        return params.rows[0].nextval as number;
    }

    public static unique<T>(array: T[]): T[] {
        return [...new Set(array)];
    }

    public static uniqueBy<T>(array: T[], key: keyof T): T[] {
        const seen = new Set();
        return array.filter((item) => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }

    public static toBase64(str: string): string {
        return Buffer.from(str).toString('base64');
    }

    public static buildUrl(baseUrl: string, queryParams?: { key: string; value: string | number | boolean }[]): string {
        const url = new URL(baseUrl);
        if (queryParams) {
            queryParams.forEach((q) => url.searchParams.append(q.key, q.value.toString()));
        }
        return url.toString();
    }
    public static Round(value: number, digits: number = 0): number {
        const factor = 10 ** digits;
        return Math.round(value * factor) / factor;
    }
    public static renameObjectKey<T>(o: any, f: string[]): T {
        const formattedRecord: any = {};
        for (const key in o) {
            const foundedField = f.find((x) => x.toLowerCase() === key.toLowerCase());
            if (foundedField && foundedField.toLowerCase() !== 'password') {
                formattedRecord[foundedField] = o[key];
            }
        }
        return formattedRecord;
    }

    public static renameArrayObjectKey<T>(a: any[], f: string[]): T[] {
        return a.map((o) => this.renameObjectKey(o, f));
    }
}
