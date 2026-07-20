import configManager from '~/managers/configManager';
import { Client, DatabaseError, Pool, QueryResult } from 'pg';
import format from 'pg-format';
import { ApiTable, DatabaseCoreQuery, InsertFormatOut, ParamsType } from '~/types/coreApiTypes';
import { OutputQueryRequest } from '../types/typeCore';
import errorHandlers from './errorHandlers';
import { StandardError } from './class/standardError';
import Ses from './ses';

export type DataBaseAppError = DatabaseError;

export class DatabaseCore {
    //#region Constructor
    private static pool: Pool;
    private static isConnected: boolean = true;
    private readonly table: ApiTable;
    private readonly formatter: (sql: string, ...args: any[]) => string;
    private readonly customTableFormater: (sql: string, ...args: any[]) => string;
    private readonly fields: string[] = [];
    protected queryObj: DatabaseCoreQuery = {};
    constructor(apiTable?: ApiTable, tableFields?: string[]) {
        this.table = apiTable;
        this.fields = tableFields;
        format.config();
        this.formatter = (sql, ...args): string => format(sql, apiTable, ...args);
        this.customTableFormater = (sql, ...args): string => format(sql, args[0], apiTable, ...args.slice(1));
    }

    public static getPool(): Pool {
        if (!DatabaseCore.pool) {
            DatabaseCore.pool = new Pool({
                ssl: configManager.sslConfig(),
                connectionTimeoutMillis: 2000,
                idleTimeoutMillis: 30000,
                max: 20,
                allowExitOnIdle: true,
            });
        }

        return DatabaseCore.pool;
    }
    //#endregion

    //#region Protected
    public async getAll<T>(): Promise<OutputQueryRequest<T>> {
        const result = await this.databaseEngine<T>(this.formatter(`SELECT ${this.table}.*, count(*) OVER() AS "totalRecords" FROM %I`));
        const out = this.formatOutputData<T>(result);
        out.totalAllRecords = result.rowCount;
        return out;
    }

    public async getById<T>(id: number): Promise<OutputQueryRequest<T>> {
        const result = await this.databaseEngine<T>(this.formatter(`SELECT ${this.table}.*, count(*) OVER() AS "totalRecords" FROM %I WHERE ${this.table}.id = $1`), [id]);
        const out = this.formatOutputData<T>(result);
        out.totalAllRecords = null;
        return out;
    }

    public getClient(): Client {
        return new Client();
    }

    public async getByQuery<T>(query: DatabaseCoreQuery<T>): Promise<OutputQueryRequest<T>> {
        const queryFormat = this.queryString(query);
        const orderMode = query.asc ? 'ASC NULLS FIRST' : 'DESC NULLS LAST';
        const args = [];
        if (!query.offset && query.limit !== -1) {
            query.offset = 0;
        }

        if (!query.limit && query.limit !== -1) {
            query.limit = 10;
        }
        let baseSql = 'SELECT %s FROM %I';
        args.push(queryFormat.select);
        if (queryFormat.join.length > 0) {
            baseSql += ' %s';
            args.push(queryFormat.join);
        }
        if (queryFormat.where.length > 0) {
            baseSql += ' WHERE %s';
            args.push(queryFormat.where);
        }
        if (query.multiOrder && query.multiOrder.length > 0) {
            baseSql += ' ORDER BY %s';
            const multiOrderString = query.multiOrder.map((o) => `${String(o.field)} ${o.asc ? 'ASC NULLS FIRST' : 'DESC NULLS LAST'}`).join(', ');
            args.push(multiOrderString);
        } else if (query.order) {
            baseSql += ' ORDER BY %I %s';
            args.push(query.order.toString().toLowerCase(), orderMode);
        }
        if (query.limit !== -1) {
            baseSql += ' OFFSET %s LIMIT %s';
            args.push(query.offset, query.limit);
        }
        let SQLString = this.customTableFormater(baseSql, ...args);
        const result = await this.databaseEngine<T>(SQLString, queryFormat.data);
        const out = this.formatOutputData<T>(result, query.offset, query.limit);
        const count = await this.query<{ c: string }>(`SELECT COUNT(1) c FROM ${this.table}`);
        out.totalAllRecords = parseInt(count.rows[0].c);
        return out;
    }

    /**
     *
     * @param dataToInsert Payload to insert
     * @param uniq uniq fields to check before insert
     * @returns
     */
    public async insert<P, T = any>(dataToInsert: P, uniq?: (keyof P)[]): Promise<OutputQueryRequest<T>> {
        const insertFormat = this.insertFormat<P>(dataToInsert, uniq);
        let SQLString = this.formatter('INSERT INTO %I (%s) VALUES (%s) RETURNING *', insertFormat.insert, insertFormat.values);

        if (uniq && uniq.length > 0) {
            SQLString = this.formatter('INSERT INTO %I (%s) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM %I WHERE %s) RETURNING *', insertFormat.insert, insertFormat.values, this.table, insertFormat.uniq);
        }
        const inserted = await this.databaseEngine<T>(SQLString, insertFormat.data);
        return this.formatOutputData<T>(inserted);
    }

    public async multipleInsert<P, T = any>(dataToInsert: P[], uniq?: (keyof P)[]): Promise<OutputQueryRequest<T>> {
        const insertFormat = this.multipleInsertFormat(dataToInsert, uniq);
        let SQLString = this.formatter('INSERT INTO %I (%s) VALUES \n %s \n RETURNING *', insertFormat.insert, insertFormat.values);

        if (uniq && uniq.length > 0) {
            SQLString = this.formatter('INSERT INTO %I (%s) SELECT %s WHERE NOT EXISTS (SELECT 1 FROM %I WHERE %s) RETURNING *', insertFormat.insert, insertFormat.values, this.table, insertFormat.uniq);
        }

        const inserted = await this.databaseEngine<T>(SQLString, insertFormat.data);
        return this.formatOutputData(inserted);
    }

    public async updateRecord<T>(where: DatabaseCoreQuery): Promise<QueryResult<T>> {
        const queryString = this.queryString(where);
        const SQLString = where.where ? this.formatter('UPDATE %I SET %s WHERE %s RETURNING *', queryString.updateString, queryString.where) : this.formatter('UPDATE %I SET %s RETURNING *', queryString.updateString);
        const updated = await this.databaseEngine<T>(SQLString, queryString.data);
        return updated;
    }

    public async deleteRecord(id: number): Promise<boolean> {
        await this.databaseEngine(this.formatter('DELETE FROM %I WHERE id = $1'), [id]);
        return true;
    }

    public async query<T>(sqlString: string, ...args: any): Promise<QueryResult<T>> {
        const queryResult = await this.databaseEngine<T>(sqlString, args);
        return queryResult;
    }
    public static async disconnectAll(): Promise<void> {
        if (DatabaseCore.pool) {
            await DatabaseCore.pool.end();
            DatabaseCore.pool = null;
        }
    }

    public static async ping(): Promise<void> {
        try {
            const pool = DatabaseCore.getPool();
            await pool.query('SELECT 1', []);
            console.log('Connected to DB ✅');
        } catch (err) {
            throw new StandardError('db.ping', 'FATAL', 'no_db', 'unable connect to db', err.message, false, err);
        }
    }
    //#endregion

    //#region Private
    private async databaseEngine<T>(queryString: string, data?: any[]): Promise<QueryResult<T>> {
        try {
            const start = new Date();
            if (!configManager.isProduction()) DatabaseCore.logSQL(queryString, data);
            const pool = DatabaseCore.getPool();
            const out = await pool.query<T>(queryString, data ? data : []);
            if (Ses.IsSessionWritable && Ses.IsPerfActive) {
                Ses.updatePerf((perf) => {
                    perf.add('PostgreSQL', DatabaseCore.decodeSQL(queryString, data), start, Ses.CurrentReqUrl);
                });
            }
            return out;
        } catch (error) {
            if (Ses.IsSessionWritable) Ses.clearPerf();
            if (configManager.isProduction()) DatabaseCore.logSQL(queryString, data);
            errorHandlers.errorSql('DatabaseCore.DatabaseEngine', error, false, queryString);
        }
    }
    private multipleInsertFormat<T>(obj: T[], uniq?: (keyof T)[]): InsertFormatOut {
        let index = 0;
        const params = Object.keys(obj[0]);
        const values: string[] = [];
        const output: InsertFormatOut = {
            insert: params.join(', '),
            values: '',
            data: [],
            uniq: null,
        };

        obj.forEach((o) => {
            const insert = this.insertFormat(o, uniq, index);
            values.push('(' + insert.values + ')');
            output.data = [...output.data, ...insert.data];
            index += insert.data.length;
        });
        output.values = values.join(',\n');
        return output;
    }
    private insertFormat<T>(obj: T, uniq?: (keyof T)[], startIndex: number = 0): InsertFormatOut {
        const params = [];
        const dataOutput: any[] = [];

        let i = startIndex;
        let values = '';
        let uniqClause = '';

        for (const key in obj) {
            if (key.toLowerCase() === 'id' || key.toLowerCase() === 'genericaction' || key.toLowerCase() === 'action') continue;
            i += 1;
            values += `$${i},`;
            dataOutput.push(obj[key]);
            params.push(key);
        }

        if (uniq && uniq.length > 0) {
            uniq.forEach((u) => {
                i += 1;
                if (uniqClause.length > 0) uniqClause += ' AND ';
                uniqClause += `${u as string} = $${i}`;
                dataOutput.push(obj[u]);
            });
        }

        const formatValues = values.slice(0, -1);
        const output: InsertFormatOut = {
            insert: params.join(','),
            values: formatValues,
            data: dataOutput,
            uniq: uniqClause,
        };

        return output;
    }

    private queryString(query: DatabaseCoreQuery): ParamsType {
        let updateString = '';
        let whereString = '';
        let selectString = '';
        let joinString = '';

        let i = 0;
        const dataOutput: any[] = [];

        const addCondition = (key: string, operator: string, value: any, isArray = false, isNot = false): void => {
            const formattedKey = !key.includes('.') ? `${this.table}.${key}` : key;
            if (isArray) {
                const placeholders = value.map((_: any, idx: number) => `$${i + idx + 1}`).join(',');
                whereString += `${formattedKey} ${isNot ? 'NOT' : 'IN'} (${placeholders}) AND `;
                value.forEach((v: any) => dataOutput.push(v));
                i += value.length;
            } else {
                i++;
                whereString += `${formattedKey} ${isNot ? '!' : ''}${operator} $${i} AND `;
                dataOutput.push(value);
            }
        };

        if (query.where) {
            for (const condition in query.where) {
                switch (condition) {
                    case 'like':
                    case 'start':
                    case 'notLike': {
                        const isNotLike = condition === 'notLike';
                        const isStart = condition === 'start';
                        for (const key in query.where[condition]) {
                            query.where[condition][key].forEach((l: string) => {
                                i++;
                                const isCaseSensitive = l.endsWith("$");
                                const toSearch = (x: string | number): string => isCaseSensitive ? `unaccent(${x})` : `LOWER(unaccent(${x}))`
                                const clause = `${toSearch(key)} ${isNotLike ? 'NOT ' : ''}LIKE ${toSearch("$" + i)}`;
                                whereString += query.where[condition][key].length > 1 ? `(${clause}) OR ` : `${clause} AND `;
                                const valToSearch = (!isStart ? "%" : "") + l.replace("$", "") + "%"
                                dataOutput.push(valToSearch);
                            });
                        }
                        break;
                    }
                    case 'equals':
                    case 'notEquals': {
                        const isNotEquals = condition === 'notEquals';
                        for (const key in query.where[condition]) {
                            const isArray = Array.isArray(query.where[condition][key]);
                            addCondition(key, isArray ? 'IN' : '=', query.where[condition][key], isArray, isNotEquals);
                        }
                        break;
                    }
                    case 'lower':
                        for (const key in query.where[condition]) {
                            addCondition(key, '<', query.where[condition][key]);
                        }
                        break;
                    case 'lowerEquals':
                        for (const key in query.where[condition]) {
                            addCondition(key, '<=', query.where[condition][key]);
                        }
                        break;
                    case 'upper':
                        for (const key in query.where[condition]) {
                            addCondition(key, '>', query.where[condition][key]);
                        }
                        break;
                    case 'upperEquals':
                        for (const key in query.where[condition]) {
                            addCondition(key, '>=', query.where[condition][key]);
                        }
                        break;
                    case 'rawQuery':
                        if (query.where[condition].length > 0) {
                            whereString += query.where[condition].join(' AND ') + ' AND ';
                        }
                        break;
                }
            }
        }

        if (query.update) {
            for (const key in query.update) {
                if (key.toLowerCase() === 'id' || key.toLowerCase() === 'genericaction' || key.toLowerCase() === 'action') continue;
                if (key.toLowerCase() === 'password' && (query.update[key] ?? '') === '') continue;
                i++;
                updateString += `${key} = $${i},`;
                dataOutput.push(query.update[key]);
            }
        }

        if (query.join) {
            query.join.forEach((join) => {
                joinString += `${join.type} JOIN ${join.join} ON ${join.join}.${join.reference} = ${join.joinTarget || this.table}.${join.target} `;
            });
        }

        selectString = `${this.table}.*${query.select ? `, ${query.select.join(',')}` : ''}, count(*) OVER() AS "totalRecords"`;
        return {
            updateString: updateString.slice(0, -1),
            where: whereString.slice(0, -5).trim(),
            select: selectString.trim(),
            data: dataOutput,
            join: joinString.trim(),
        };
    }

    public formatOutputData<T>(result: QueryResult, offset?: number, limit?: number): OutputQueryRequest<T> {
        const output: OutputQueryRequest<T> = {
            records: result.rows.map((record: any) => {
                const formattedRecord: any = {};
                for (const key in record) {
                    const foundedField = this.fields.find((f) => f.toLowerCase() === key.toLowerCase());
                    if (foundedField && foundedField.toLowerCase() !== 'password') {
                        formattedRecord[foundedField] = record[key];
                    }
                }
                return formattedRecord;
            }),
            totalRecords: 0,
            offset: limit < 0 ? null : offset,
            limit: limit < 0 ? null : limit,
            totalAllRecords: 0
        };

        if (result.rowCount === 0) {
            output.totalRecords = 0;
        } else {
            output.totalRecords = parseInt(result.rows[0].totalRecords);
            output.offset = limit < 0 ? null : offset;
            output.limit = limit < 0 ? null : limit;
        }
        // output.records.forEach((records) => {
        //     delete records.totalRecords;
        // });
        return output;
    }
    public static formatData<T>(result: QueryResult, fields: string[], offset?: number, limit?: number): OutputQueryRequest<T> {
        const output: any = {
            records: result.rows.map((record: any) => {
                const formattedRecord: any = {};
                for (const key in record) {
                    const foundedField = fields.find((f) => f.toLowerCase() === key.toLowerCase());
                    if (foundedField && foundedField.toLowerCase() !== 'password') {
                        formattedRecord[foundedField] = record[key];
                    }
                }
                return formattedRecord;
            }),
            totalRecords: 0,
        };

        if (result.rowCount === 0) {
            output.message = 'records not founds';
        } else {
            output.totalRecords = parseInt(result.rows[0].totalRecords);
            output.offset = offset;
            output.limit = limit;
        }
        output.records.forEach((records) => {
            delete records.totalRecords;
        });
        return output;
    }

    public static decodeSQL(sql: string, datas: unknown[]): string {
        if (!datas || datas.length === 0) {
            return sql;
        }
        const out = sql.replace(/\$(\d+)/g, (_, i) => {
            const val = datas[parseInt(i) - 1];
            if (typeof val === 'string') return `'${val}'`;
            if (val === null || val === undefined) return 'NULL';
            return val.toString();
        });

        return out;
    }
    public static logSQL(sql: string, datas: unknown[]): void {
        const out = this.decodeSQL(sql, datas);
        console.log('Logged db query ', out);
        console.log('');
        return;
    }

    //#endregion
}
