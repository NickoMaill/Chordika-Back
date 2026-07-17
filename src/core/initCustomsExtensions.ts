const define = (target: any, name: string, func: Function): void => {
    Object.defineProperty(target, name, {
        value: func,
        writable: true,
        configurable: true,
    });
};

const initCustomsExtensions = (): void => {
    define(Array.prototype, 'toSet', function () {
        return new Set(this);
    });

    define(Set.prototype, 'toArray', function () {
        return Array.from(this);
    });

    define(Array.prototype, 'insertAt', function <T>(index: number, ...elements: T[]) {
        this.splice(index, 0, ...elements);
        return this;
    });

    define(Array.prototype, 'sum', function <T>(selector: (e: T) => number) {
        return this.reduce((acc: number, item: T) => acc + selector(item), 0);
    });

    define(Array.prototype, 'count', function <T>(selector: (e: T) => boolean) {
        return this.reduce((acc: number, item: T) => acc + (selector(item) ? 1 : 0), 0);
    });

    define(Array.prototype, 'average', function <T>(selector: (e: T) => number) {
        const sum = this.reduce((acc: number, item: T) => acc + selector(item), 0);
        return this.length > 0 ? sum / this.length : 0;
    });

    define(Array.prototype, 'distinct', function <T>(this: T[]) {
        return [...new Set(this)];
    });

    define(Array.prototype, 'groupBy', function <T, K extends string | number>(this: T[], keyFn: (item: T) => K) {
        const map = new Map<K, T[]>();

        for (const item of this) {
            const key = keyFn(item);
            if (!map.has(key)) {
                map.set(key, []);
            }
            map.get(key)!.push(item);
        }

        return Array.from(map.entries()).map(([key, group]) => ({ key, group }));
    });

    define(Array.prototype, 'min', function <T>(this: T[], selector?: (item: T) => number): number | T | undefined {
        if (this.length === 0) return undefined;

        if (!selector) {
            if (typeof this[0] === 'number') {
                return Math.min(...(this as unknown as number[]));
            } else {
                throw new Error('min() requires a selector when used on non-numeric arrays');
            }
        }

        return this.reduce((min, curr) => (selector(curr) < selector(min) ? curr : min));
    });

    define(Array.prototype, 'max', function <T>(this: T[], selector?: (item: T) => number): number | T | undefined {
        if (this.length === 0) return undefined;

        if (!selector) {
            if (typeof this[0] === 'number') {
                return Math.max(...(this as unknown as number[]));
            } else {
                throw new Error('max() requires a selector when used on non-numeric arrays');
            }
        }

        return this.reduce((max, curr) => (selector(curr) > selector(max) ? curr : max));
    });

    define(Array.prototype, 'cleanNullValues', function () {
        this.filter((element: unknown) => element !== null && element !== undefined);
        return this;
    });

    define(String.prototype, 'toCapitalize', function () {
        return this.toLowerCase()
            .split('-')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join('-')
            .split(' ')
            .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
            .join(' ');
    });
    define(String.prototype, 'padLeft', function (length: number, char: string) {
        return this.length >= length ? this : char.repeat(length - this.length) + this;
    });
    define(String.prototype, 'padRight', function (length: number, char: string) {
        return this.length >= length ? this : this + char.repeat(length - this.length);
    });

    define(String.prototype, 'removeDiacritics', function () {
        return (
            this.normalize('NFD')
                // .replace(/[\u0300-\u036f]/g, '')
                // .replace(/[\u0300-\u036f]/g, '')
                .replace(/ß/g, 'ss')
                .replace(/œ/g, 'oe')
                .replace(/æ/g, 'ae')
                .replace(/ç/g, 'c')
                .replace(/ñ/g, 'n')
                .replace(/é/g, 'e')
                .replace(/è/g, 'e')
                .replace(/ë/g, 'e')
                .replace(/ê/g, 'e')
                .replace(/â/g, 'a')
                .replace(/ä/g, 'a')
                .replace(/à/g, 'a')
                .replace(/ù/g, 'u')
                .replace(/û/g, 'u')
                .replace(/ü/g, 'u')
                .replace(/ô/g, 'o')
                .replace(/ö/g, 'o')
        );
    });

    define(String.prototype, 'toBoolean', function () {
        return this.toLowerCase() === 'true';
    });

    // 🔁 mapValues
    define(Object.prototype, 'mapValues', function <T>(this: Record<string, T>, fn: (value: T, key: string) => any) {
        return Object.fromEntries(Object.entries(this).map(([k, v]) => [k, fn(v, k)]));
    });

    // 🔁 mapKeys
    define(Object.prototype, 'mapKeys', function <T>(this: Record<string, T>, fn: (key: string, value: T) => string) {
        return Object.fromEntries(Object.entries(this).map(([k, v]) => [fn(k, v), v]));
    });

    // 🧽 clean
    define(Object.prototype, 'clean', function (this: Record<string, any>) {
        return Object.fromEntries(Object.entries(this).filter(([_, v]) => v !== null && v !== undefined && v !== ''));
    });

    // 🔒 clone
    define(Object.prototype, 'clone', function <T>(this: T): T {
        return Object.assign({}, this);
    });

    // 🔒 deepClone
    define(Object.prototype, 'deepClone', function <T>(this: T): T {
        return JSON.parse(JSON.stringify(this));
    });

    // 🧬 merge
    define(Object.prototype, 'merge', function (this: any, other: object) {
        return Object.assign({}, this, other);
    });

    // 🔍 getPath
    define(Object.prototype, 'getPath', function (this: any, path: string) {
        return path.split('.').reduce((obj, key) => obj?.[key], this);
    });

    // ✅ hasKeys
    define(Object.prototype, 'hasKeys', function (this: object, ...keys: string[]) {
        return keys.every((k) => Object.prototype.hasOwnProperty.call(this, k));
    });

    // 📦 entries, keys, values (shortcut)
    define(Object.prototype, 'entries', function (this: object) {
        return Object.entries(this);
    });

    define(Object.prototype, 'keys', function (this: object) {
        return Object.keys(this);
    });

    define(Object.prototype, 'values', function (this: object) {
        return Object.values(this);
    });

    define(Object.prototype, 'forEachProp', function <T extends object>(this: T, callback: <K extends keyof T>(key: K, value: T[K], index: number) => void): void {
        const keys = Object.keys(this) as (keyof T)[];
        keys.forEach((key, index) => {
            callback(key, this[key], index);
        });
    });

    define(Math, 'roundTo', function (value: number, decimals: number = 0): number {
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    });
};

initCustomsExtensions();
