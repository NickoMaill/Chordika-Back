import { Panel, Search, Tab } from './formMaker';
import { UserAccessLevel } from './typeCore';

export type FormField = {
    field: string;
    fieldName: string;
    fieldType: SearchContentTypeEnum;
    isUnique: boolean;
    isRequired: boolean;
};
export enum SearchContentTypeEnum {
    NUM = 0,
    TEXT = 1,
    DATE = 2,
    NONE = 3,
    BOOL = 4,
}
export type GrammarModel = {
    singular: string;
    plural: string;
    singularArticle: string;
    pluralArticle: string;
    isFem: boolean;
};

export interface TableDisplay<T> {
    colStruct: Col<T>[];
    actions: string[];
    defaultSort?: SorterParams<T>;
}

export interface SorterParams<T> {
    field: keyof T;
    sort?: 'asc' | 'desc';
}

export enum TableType {
    TEXT = 'string',
    NUM = 'number',
    DATE = 'date',
    DATETIME = 'dateTime',
    BOOL = 'boolean',
}

export interface Col<T> {
    headerField: keyof T;
    headerLabel: string;
    sortable?: boolean;
    type: TableType;
    width?: number;
    isEditable?: boolean;
    headerClassName?: string;
    cellClassName?: string;
    format?: string;
    align?: 'left' | 'center' | 'right';
    headerAlign?: 'left' | 'center' | 'right';
    minWidth?: number;
    defaultSorted?: boolean;
    defaultSortedOrder?: 'asc' | 'desc';
}

export interface ICenterConfig<T> {
    grammar: {
        singular: string;
        plural: string;
        singularArticle: string;
        pluralArticle: string;
        isFem: boolean;
    };
    formTemplate: Tab[] | Panel[] | Search[];
    searchFormTemplate: Search[];
    tableStructure: TableDisplay<T>;
    icon: string;
    searchFieldDefault: string;
    allowAdd: boolean;
    allowUpdate: boolean;
    allowDelete: boolean;
    allowExport: boolean;
    bulkNew: boolean;
    bulkUpdate: boolean;
    level: UserAccessLevel;
    levelNew: UserAccessLevel;
    levelUpdate: UserAccessLevel;
    levelDelete: UserAccessLevel;
    levelExport: UserAccessLevel;
    levelBulkNew: UserAccessLevel;
    levelBulkUpdate: UserAccessLevel;
    levelBulkDelete: UserAccessLevel;
}
