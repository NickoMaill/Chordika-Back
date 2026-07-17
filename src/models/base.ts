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
}
