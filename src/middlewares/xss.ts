import { NextFunction, Request, Response } from 'express';
import xss from 'xss';

export const sanitizeXss = (req: Request, _res: Response, next: NextFunction): void => {
    [req.body, req.query, req.params].forEach((source) => {
        if (source && typeof source === 'object') {
            sanitizeRecursive(source);
        }
    });
    next();
};

const sanitizeRecursive = (input: any): void => {
    if (Array.isArray(input)) {
        input.forEach((item, i) => {
            if (typeof item === 'string') {
                input[i] = xss(item);
            } else if (typeof item === 'object' && item !== null) {
                sanitizeRecursive(item);
            }
        });
    } else if (typeof input === 'object' && input !== null) {
        Object.keys(input).forEach((key) => {
            const value = input[key];
            if (typeof value === 'string') {
                input[key] = xss(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitizeRecursive(value);
            }
        });
    }
};
