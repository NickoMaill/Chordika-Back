import { HttpError } from 'http-errors';
import { NextFunction } from 'express';
import configManager from '../managers/configManager';
import logManager from '../managers/logManager';
import { StandardError } from '../core/class/standardError';
import { AppRequest, AppResponse } from '../core/controllerBase';

class Handlers {
    public async errorHandler(err: any, _req: AppRequest, res: AppResponse, _next: NextFunction): Promise<void> {
        console.log('error handler', err);
        if (err instanceof StandardError) {
            const error = err as StandardError<any>;
            if (err.log) {
                logManager.setLog(error.key, `-> [${error.code}] : ${error.message} -> ${error.detailedMessage}`);
                logManager.setLog(error.key, `-> [${error.code}] : ${error.stack}`);
            }

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

                if (!configManager.getConfig.SHOW_ERROR_DETAILS) {
                    res.status(statusCode).json({ code: error.code, message: error.message, data: error.data });
                } else {
                    res.status(statusCode).json({
                        code: error.code,
                        message: error.message,
                        detailedMessage: error.detailedMessage,
                        data: error.data,
                    });
                }
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

    public noCacheMiddleware(err: any, req: AppRequest, res: AppResponse, next: NextFunction): void {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.set('Surrogate-Control', 'no-store');
        next();
    }

    public scheduleCorsHandler(req: AppRequest, res: AppResponse, next: NextFunction): void {
        // const allowedHost = configManager.getConfig.API_BASEURL.replace('https://', '').replace('/api', '');
        // if (configManager.isProduction() && req.get('Host') !== allowedHost) {
        //     throw new StandardError('cors', 'UNAUTHORIZED', 'unauthorized', 'unable to contact url', `unable to contact requested url, origin : ${req.get('Host')}`, true);
        // }
        next();
    }

    public handlerPerfUID(req: AppRequest, res: AppResponse, next: NextFunction): void {
        const perfUID = req.header('X-Perf-UID');
        if (perfUID) {
            // req.perfUID = perfUID;
        }
        next();
    }
}

export default new Handlers();
