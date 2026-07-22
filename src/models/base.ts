import { DatabaseCore } from '~/core/dataBaseCore';
import { ApiTable, DatabaseCoreQuery } from '~/types/coreApiTypes';
import { OutputQueryRequest } from '~/types/typeCore';
export class Model {
    protected static table: ApiTable;

    public static getTable(): ApiTable {
        return this.table;
    }

    public static getColumns<T extends Model>(this: new () => T): string[] {
        const instance = new this();
        return Object.keys(instance);
    }

    public static async getById<T extends Model>(this: { new (): T; getColumns(): string[]; getTable(): ApiTable }, id: number): Promise<T | null> {
        const table = this.getTable();
        if (!table) return null;

        const engine = new DatabaseCore(table, this.getColumns());
        const x = await engine.getById<T>(id);

        if (x.totalRecords > 0) return x.records[0];
        return null;
    }

    public static async getByQuery<T extends Model>(this: { new (): T; getColumns(): string[]; getTable(): ApiTable }, query: DatabaseCoreQuery<T>): Promise<OutputQueryRequest<T>> {
        const table = this.getTable();
        if (!table) return null;

        const engine = new DatabaseCore(table, this.getColumns());
        const x = await engine.getByQuery(query);

        return x;
    }

    public static async new<T, P>(payload: P, uniq?: (keyof P)[]): Promise<T> {
        const table = this.getTable();
        if (!table) return null;

        const engine = new DatabaseCore(table, this.getColumns());
        const inserted = await engine.insert<P, T>(payload, uniq);
        return inserted.records[0];
    }

    public static async update<T, P>(where: DatabaseCoreQuery<T, P>): Promise<T> {
        const table = this.getTable();
        if (!table) return null;

        const engine = new DatabaseCore(table, this.getColumns());
        const updated = await engine.updateRecord<T>(where);
        return updated.rows[0];
    }

    public static async delete(id: number): Promise<boolean> {
        const table = this.getTable();
        if (!table) return null;

        const engine = new DatabaseCore(table, this.getColumns());
        await engine.deleteRecord(id);
        return true;
    }
}
