export type InsertFormatOut = {
    insert: string;
    values: string;
    data: any[];
    uniq?: string;
};

export type ParamsType = {
    updateString?: string;
    data?: any[];
    where?: string;
    select?: string;
    join?: string;
};

export type Like<T = any> = {
    [K in keyof T | any]?: string[];
};

export type TableExtraWhereType<T> = { like?: Like<T>; equals?: Partial<T> }
export type TableExtraFromType = { reference: string; target: string; join: ApiTable; type: 'INNER' | 'LEFT' | ''; joinTarget?: ApiTable }

export type DatabaseCoreQuery<T = any, P = any> = {
    /**
     * @description a join array array object
     * @example `${join.type} JOIN ${join.join} ON ${join.join}.${join.reference} = ${join.joinTarget || this.table}.${join.target}`;
     */
    join?: {
        /**
         * @description foreign key of joined table
         */
        reference: string;
        /**
         * @description foreign key of table reference
         */
        target: string;
        /**
         * @description table to join
         */
        join: ApiTable;
        /**
         * @description Type of join
         */
        type: 'INNER' | 'LEFT' | 'OUTER' | '';
        /**
         * @description references table of the join
         */
        joinTarget?: ApiTable;
    }[];
    select?: (keyof T)[] | string[];
    like?: string[];
    update?: P;
    where?: WhereQuery<T | any>;
    order?: keyof T;
    multiOrder?: { field: keyof T; asc: boolean }[];
    asc?: boolean;
    offset?: number;
    limit?: number;
};

export type WhereQuery<T> = {
    like?: Like<T>;
    start?: Like<T>;
    equals?: WhereEquals<T | any>;
    notLike?: Like<T>;
    notEquals?: WhereEquals<T | any>;
    upper?: WhereEquals<T>;
    upperEquals?: WhereEquals<T | any>;
    lower?: WhereEquals<T | any>;
    lowerEquals?: WhereEquals<T | any>;
    rawQuery?: string[];
};

type WhereEquals<T> = {
    [K in keyof T]?: T[K] | T[K][];
};

export type QuerySearch<T> = {
    field: string;
    dbField: keyof T | string;
    table?: ApiTable;
    typeWhere: 'LIKE' | 'EQUALS' | 'START';
    typeClause: 'IN' | 'EQUALS';
    caseSensitive?: boolean;
};

export const initCoreQuery: DatabaseCoreQuery<any> = {
    join: null,
    select: null,
    like: null,
    update: null,
    where: null,
    order: null,
    asc: false,
    offset: null,
    limit: null,
};

export enum ApiTable {
    USERS = 'users',
    LOGS = 'logs',
    DATATEXT = 'datatext',
    PARAMS = 'params',
    SCORES = 'scores',
    SCHEDULES = 'schedules',
    TOKENS = 'tokens',
    USERS_PREFERENCES = 'userspreferences',
    REPERTOIRES = "repertoires"
}
