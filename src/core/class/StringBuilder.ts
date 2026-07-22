export default class StringBuilder {
    private parts: string[];

    constructor(parts: string[] = []) {
        this.parts = parts;
    }

    public get length(): number {
        return this.parts.join('').length;
    }

    public get isEmpty(): boolean {
        return this.parts.length === 0;
    }

    public append(part: string): StringBuilder {
        this.parts = [...this.parts, part];
        return this;
    }

    public appendLine(part: string = ''): StringBuilder {
        this.parts = [...this.parts, part + '\n'];
        return this;
    }

    public insertAt(index: number, value: string): StringBuilder {
        const current = this.toString();
        const newStr = current.slice(0, index) + value + current.slice(index);
        this.parts = [newStr];
        return this;
    }

    public replace(search: string | RegExp, replace: string): StringBuilder {
        const result = this.toString().replace(search, replace);
        this.parts = [result];
        return this;
    }

    public clear(): StringBuilder {
        this.parts = [];
        return this;
    }

    public toString(): string {
        return this.parts.join('');
    }
}
