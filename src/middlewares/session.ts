import { NextFunction } from 'express';
import { AppRequest, AppResponse } from '~/core/controllerBase';
import Ses from '~/core/ses';

export const initSes = (req: AppRequest, _res: AppResponse, next: NextFunction): void => {
    const perfUID = req.header('X-Perf-UID');
    if (perfUID) {
        req.perfUID = perfUID;
    }

    Ses.setSession(req);
    next();
};
