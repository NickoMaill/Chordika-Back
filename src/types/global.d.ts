export {};
/**
 * Custom JavaScript extensions for native types: Array, Set, String, Object, and Math.
 */
declare global {
    interface Array<T> {
        /**
         * Converts the array to a Set to remove duplicates.
         * @returns A Set containing unique values from the array.
         */
        toSet(): Set<T>;

        /**
         * Inserts one or more elements at the specified index.
         * @param index The index at which to insert the elements.
         * @param elements The elements to insert.
         * @returns The modified array.
         */
        insertAt(index: number, ...elements: T[]): this;

        /**
         * Concatenates this array with other arrays.
         * @param items Arrays or values to concatenate.
         * @returns A new array with the concatenated values.
         */
        concat(...items: T[]): T[];

        /**
         * Computes the sum of the elements using a selector.
         * @param selector Function that returns the number value for each element.
         * @returns The total sum.
         */
        sum(selector: (e: T) => number): number;

        /**
         * Counts the number of elements matching a predicate.
         * @param selector Function to determine if an item should be counted.
         * @returns The number of matching elements.
         */
        count(selector: (e: T) => boolean): number;

        /**
         * Computes the average of values in the array using a selector.
         * @param selector Function to extract a number from each element.
         * @returns The average value (or 0 if array is empty).
         */
        average(selector: (item: T) => number): number;

        /**
         * Removes duplicate values from the array.
         * @returns A new array containing only unique values.
         */
        distinct(): T[];

        /**
         * Groups the array into objects based on a key selector.
         * @param keyFn Function that returns the grouping key for each element.
         * @returns An array of objects with `key` and `group` properties.
         */
        groupBy<K extends string | number>(keyFn: (item: T) => K): { key: K; group: T[] }[];

        /**
         * Finds the minimum value in a numeric array.
         * @returns The minimum number, or never if T is not a number.
         */
        min(): T extends number ? number : never;

        /**
         * Finds the element with the minimum selected value.
         * @param selector Function to extract the value for comparison.
         * @returns The element with the lowest selected value.
         */
        min(selector: (item: T) => number): T;

        /**
         * Finds the maximum value in a numeric array.
         * @returns The maximum number, or never if T is not a number.
         */
        max(): T extends number ? number : never;

        /**
         * Finds the element with the maximum selected value.
         * @param selector Function to extract the value for comparison.
         * @returns The element with the highest selected value.
         */
        max(selector: (item: T) => number): T;
        /**
         * Cleans the array by removing null, undefined, or empty string values.
         * @returns The modified array with only meaningful values.
         */
        cleanNullValues(): this;
    }

    interface Set<T> {
        /**
         * Converts the Set to an array.
         * @returns An array containing all the Set values.
         */
        toArray(): Array<T>;
    }

    interface String {
        /**
         * Capitalizes the first letter of each word.
         * @returns A string with each word capitalized.
         */
        toCapitalize(): string;

        /**
         * Pads the string from the start until it reaches the given length.
         * @param length The target length of the final string.
         * @param char The character to pad with.
         * @returns The padded string.
         */
        padLeft(length: number, char: string): string;

        /**
         * Pads the string from the end until it reaches the given length.
         * @param length The target length of the final string.
         * @param char The character to pad with.
         * @returns The padded string.
         */
        padRight(length: number, char: string): string;

        /**
         * Removes diacritics from the string.
         * @returns A string with diacritics removed.
         */
        removeDiacritics(): string;
    }

    interface Object {
        /**
         * Maps each value of the object using a transformation function.
         * @param fn Function to transform each value and optionally use the key.
         * @returns A new object with the transformed values.
         */
        mapValues<T>(fn: (value: T, key: string) => any): Record<string, any>;

        /**
         * Maps each key of the object using a transformation function.
         * @param fn Function to transform each key based on value and original key.
         * @returns A new object with transformed keys.
         */
        mapKeys<T>(fn: (key: string, value: T) => string): Record<string, T>;

        /**
         * Removes keys where the value is null, undefined, or an empty string.
         * @returns A cleaned object with only meaningful values.
         */
        clean(): Record<string, any>;

        /**
         * Creates a shallow clone of the object.
         * @returns A new object with the same keys and values.
         */
        clone<T>(): T;

        /**
         * Creates a deep clone of the object via JSON.
         * @returns A new deep-copied object.
         */
        deepClone<T>(): T;

        /**
         * Merges the current object with another one.
         * @param other The object to merge with.
         * @returns A new object combining both.
         */
        merge<T extends object>(other: Partial<T>): T;

        /**
         * Safely gets a nested property using a dot-notated string path.
         * @param path The path string (e.g., "a.b.c").
         * @returns The value at that path or undefined.
         */
        getPath(path: string): any;

        /**
         * Checks if the object contains all of the specified keys.
         * @param keys Keys to check.
         * @returns True if all keys are present.
         */
        hasKeys(...keys: string[]): boolean;

        /**
         * Returns the [key, value] entries of the object.
         * @returns An array of key-value pairs.
         */
        entries(): [string, any][];

        /**
         * Returns the own property keys of the object.
         * @returns An array of string keys.
         */
        keys(): string[];

        /**
         * Returns the values of the object.
         * @returns An array of values.
         */
        values(): any[];

        /**
         * Iterates over the properties of the object.
         * @param callback Function called for each property.
         */
        forEachProp<T extends object>(callback: <K extends keyof T>(key: K, value: T[K], index: number) => void): void;
    }

    interface Math {
        /**
         * Rounds a number to a specific number of decimal places.
         * @param value The number to round.
         * @param decimals The number of decimals to keep (default is 0).
         * @returns The rounded number.
         */
        roundTo(value: number, decimals?: number): number;
    }
}
