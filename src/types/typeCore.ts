import { RequestHandler } from 'express';

export type OutputQueryRequest<T> = {
    records: T[];
    totalRecords: number;
    totalAllRecords?: number;
    limit?: number;
    offset?: number;
};

export type DeviceDataType = {
    model: string;
    version: string;
    ip: string;
    clientSourceType: string;
    clientSourceName: string;
};

export interface BaseModel {
    id: number;
    addedAt: string;
    updatedAt?: string;
}

export enum UserAccessLevel {
    SCHEDULE = -2,
    NOBODY = -1, // to block access for everybody
    VISITOR = 0,
    USER = 1,
    ADMIN = 10,
}

export enum TokenTypeEnum {
    REFRESH = 0,
    ACCESS = 1,
    RESET = 2,
    PROXY = 3,
    HLS = 4,
}

export type RouteDefinition = {
    method: 'get' | 'post' | 'put' | 'delete';
    path: string;
    handlerName: string;
    middlewares: RequestHandler[];
    accessLevel: UserAccessLevel;
};

export function AccessLevel(level: UserAccessLevel): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, _descriptor: PropertyDescriptor) {
        if (!target.__accessLevels) {
            target.__accessLevels = {};
        }
        target.__accessLevels[propertyKey] = level;
    };
}

export enum TimeZoneEnum {
    UTC = 'UTC',
    Europe_Paris = 'Europe/Paris',
    Europe_London = 'Europe/London',
    Europe_Berlin = 'Europe/Berlin',
    Europe_Madrid = 'Europe/Madrid',
    America_New_York = 'America/New_York',
    America_Los_Angeles = 'America/Los_Angeles',
    America_Chicago = 'America/Chicago',
    America_Toronto = 'America/Toronto',
    America_Mexico_City = 'America/Mexico_City',
    America_Sao_Paulo = 'America/Sao_Paulo',
    Asia_Tokyo = 'Asia/Tokyo',
    Asia_Shanghai = 'Asia/Shanghai',
    Asia_Hong_Kong = 'Asia/Hong_Kong',
    Asia_Bangkok = 'Asia/Bangkok',
    Asia_Singapore = 'Asia/Singapore',
    Asia_Seoul = 'Asia/Seoul',
    Australia_Sydney = 'Australia/Sydney',
    Australia_Melbourne = 'Australia/Melbourne',
    Australia_Perth = 'Australia/Perth',
    Africa_Johannesburg = 'Africa/Johannesburg',
    Africa_Cairo = 'Africa/Cairo',
    Africa_Lagos = 'Africa/Lagos',
    Indian_Reunion = 'Indian/Reunion',
    Pacific_Honolulu = 'Pacific/Honolulu',
    Pacific_Auckland = 'Pacific/Auckland',
}

export type MonitorType = {
    date: string;
    datasource: string;
    smtpServer: string;
    rootURL: string;
    rootPath: string;
    sessionTimeout: number;
    encryptedConfig: boolean;
    machineName: string;
    hostName: string;
    dnsName: string;
    ipAddress: string;
    fqdn: string;
    osVersion: string;
    uptime: string;
    processors: number;
    processMemory: string;
    user: string;
    nodeVersion: string;
    forwardedFor: string;
    dbVersion: string;
    dbSize: string;
    userAccounts: number;
    isFilesFolderExists: boolean;
    currentServerTaskRunning: string[]; // À implémenter selon tes jobs en cours
    diskUsage: DiskUsageType[];
};
export type DiskUsageType = {
    name: string;
    total: number; // go
    free: number; // Go
    available: number; // Go
    usedPercent: number; // %
};
export type SQLTestOutputResult = {
    timeExec: number;
    columns: string[];
    SQL: string;
    datas?: any[];
    error?: string;
};

export type ProxyTokenData = {
    proxies: number[];
    active: number | null;
};
