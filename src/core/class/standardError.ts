// =================================================================================== //
// this is a prebuild StandardError object.                                            //
// Invoke this tool when you want to catch a server error.                             //
// =================================================================================== //
import logManager from '~/managers/logManager';
import GUID from './GUID';

export type ErrorStatusType = 'FATAL' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' | 'NOT_FOUND' | 'UNAVAILABLE' | 'TIMEOUT' | 'NOT_IMPLEMENTED' | 'RANGE_NOT_SATISFIABLE';

export class StandardError<T extends any = {}> extends Error {
    private _id: string;
    private _key: string;
    private _status: ErrorStatusType;
    private _code: string;
    private _message: string;
    private _detailedMessage: string | null = null;
    private _log: boolean;
    private _data: T | null = null;

    public get status(): ErrorStatusType {
        return this._status;
    }

    public get code(): string {
        return this._code;
    }

    public get message(): string {
        return this._message;
    }

    public get key(): string {
        return this._key;
    }

    public get id(): string {
        return this._id;
    }

    public get detailedMessage(): string {
        return this._detailedMessage;
    }

    public get log(): boolean {
        return this._log;
    }

    public get data(): T | null {
        return this._data;
    }

    constructor(key: string, status: ErrorStatusType, code: string, message: string, detailedMessage: string | null = null, log: boolean = false, data: T | null = null) {
        super(message);

        this._key = key;
        this._id = new GUID().toString();
        this._status = status;
        this._code = code;
        this._message = message;
        this._log = log;

        if (detailedMessage) this._detailedMessage = detailedMessage;

        if (data) this._data = data;
        if (this._log) logManager.setLog(this._key, `-> [${this._code}] : ${this._message} -> ${this._detailedMessage}`, this._code, null, this._data);
    }
}
