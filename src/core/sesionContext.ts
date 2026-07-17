import { AsyncLocalStorage } from 'node:async_hooks';
import { AppRequest, AppResponse } from './controllerBase';
import { NextFunction } from 'express';

const sessionStorage = new AsyncLocalStorage<AppRequest>();

export const sessionContextMiddleware = (req: AppRequest, res: AppResponse, next: NextFunction): void => {
    sessionStorage.run(req, next);
};

export const getCurrentRequest = (): AppRequest => {
    const req = sessionStorage.getStore();
    if (!req) {
        throw new Error('No current requesr un AsyncLocalStorage');
    }

    return req;
};
