import { NextFunction } from 'express';
import { AppRequest, AppResponse } from '~/core/controllerBase';
import { AppTools } from '~/helpers/appTools';

export const bodyParser = (req: AppRequest, _res: AppResponse, next: NextFunction): void => {
    for (const entry in req.body) {
        if (!isNaN(req.body[entry])) {
            if (req.body[entry].includes('.')) {
                req.body[entry] = parseFloat(req.body[entry]);
            } else {
                req.body[entry] = parseInt(req.body[entry]);
            }
        }
        if (req.body[entry] === 'true' || req.body[entry] === 'false') {
            req.body[entry] = Boolean(req.body[entry]);
        }
    }
    next();
};

export const queryParser = (req: AppRequest, res: AppResponse, next: NextFunction): void => {
    AppTools.parseQuery(req.query);
    next();
};
