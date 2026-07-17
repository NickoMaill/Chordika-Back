// =================================================================================== //
// this is a prebuild StandardError object.                                            //
// Invoke this tool when you want to catch a server error.                             //
// =================================================================================== //

import { NextFunction } from 'express';
import { AppRequest, AppResponse } from './controllerBase';
import { HttpError } from 'http-errors';
import { StandardError } from './class/standardError';
import configManager from '../managers/configManager';
import logManager from '../managers/logManager';
import { DataBaseAppError } from './dataBaseCore';
import { DatabaseError } from 'pg';

class ErrorHandlers {
    public async commonErrorHandler(err: any, _req: AppRequest, res: AppResponse, _next: NextFunction): Promise<void> {
        if (err instanceof StandardError) {
            const error = err as StandardError<any>;

            logManager.setLog(error.key, `-> [${error.code}] : ${error.message} -> ${error.detailedMessage}`);
            logManager.setLog(error.key, `-> [${error.code}] : ${error.stack}`);

            if (!res.headersSent) {
                let statusCode: number;
                switch (error.status) {
                    case 'BAD_REQUEST':
                        statusCode = 400;
                        break;
                    case 'UNAUTHORIZED':
                        statusCode = 401;
                        break;
                    case 'FORBIDDEN':
                        statusCode = 403;
                        break;
                    case 'NOT_FOUND':
                        statusCode = 404;
                        break;
                    case 'TIMEOUT':
                        statusCode = 408;
                        break;
                    case 'RANGE_NOT_SATISFIABLE':
                        statusCode = 416;
                        break;
                    case 'UNAVAILABLE':
                        statusCode = 503;
                        break;
                    case 'NOT_IMPLEMENTED':
                        statusCode = 501;
                        break;
                    default:
                        statusCode = 500;
                        break;
                }
                res.status(statusCode).json(err);
            }
        } else if (err instanceof HttpError) {
            const error = err as Error;

            logManager.setLog('AppErrorHandler', `${(err as Error).message} -> ${(err as Error).stack}`);
            res.status(err.status).json({
                code: 'http_error',
                message: configManager.getConfig.SHOW_ERROR_DETAILS ? error.message : `Internal Server Error!`,
            });
        } else {
            const error = err as Error;

            logManager.setLog('AppErrorHandler', `${error.message} -> ${error.stack}`);
            res.status(500).json({
                code: 'internal_error',
                message: configManager.getConfig.SHOW_ERROR_DETAILS ? error.message : `Internal Server Error!`,
            });
        }
    }
    public errorSql(stack: string, err: DataBaseAppError, log: boolean = false, sql: string = ''): void {
        if (err instanceof DatabaseError) {
            switch (err.code) {
                case '23000':
                    throw new StandardError(stack, 'BAD_REQUEST', 'integrity_constraint_violation', 'integrity constraint violation', err.message ? err.message : 'integrity constraint violation \n ' + sql, log, err);
                case '23001':
                    throw new StandardError(stack, 'BAD_REQUEST', 'restrict_violation', 'restrict violation', err.message ? err.message : 'restrict violation \n ' + sql, log, err);
                case '23502':
                    throw new StandardError(stack, 'BAD_REQUEST', 'not_null_violation', 'not null violation', err.message ? err.message : 'not null violation \n ' + sql, log, err);
                case '23503':
                    throw new StandardError(stack, 'BAD_REQUEST', 'foreign_key_violation', 'foreign key violation', err.message ? err.message : 'foreign key violation \n ' + sql, log, err);
                case '23505':
                    throw new StandardError(stack, 'BAD_REQUEST', 'uniq_violation', 'uniq error violation', err.message ? err.message : 'uniq error violation \n ' + sql, log, err);
                case '23514':
                    throw new StandardError(stack, 'BAD_REQUEST', 'check_violation', 'check error violation', err.message ? err.message : 'check error violation \n ' + sql, log, err);
                case '42703':
                    throw new StandardError(stack, 'BAD_REQUEST', 'invalid_column_reference', 'invalid column reference', err.message ? err.message : 'invalid column reference \n ' + sql, log, err);
                case '42P01':
                    throw new StandardError(stack, 'FATAL', 'undefined_table', 'no relation found', err.message ? err.message : 'undefined table \n ' + sql, log, err);
                case '42P10':
                    throw new StandardError(stack, 'FATAL', 'undefined_column', 'undefined column', err.message ? err.message : 'undefined column \n ' + sql, log, err);
                default:
                    throw new StandardError(stack, 'FATAL', `sql_code -> ${err.code}`, 'Database error', err.message ? err.message : 'Database error \n ' + sql, log, err);
            }
        } else {
            throw new StandardError(stack, 'FATAL', 'error_happened', 'an error happened during request', 'an error happened during request \n ' + sql, log, err);
        }
    }
}

export default new ErrorHandlers();
