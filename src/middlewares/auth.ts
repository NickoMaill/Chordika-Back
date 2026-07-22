import { NextFunction } from 'express';
import { AppRequest, AppResponse } from '~/core/controllerBase';
import Ses from '~/core/ses';
import { StandardError } from '~/core/class/standardError';
import { UserAccessLevel } from '~/types/typeCore';
import AdminManager from '~/managers/adminManager';
import configManager from '~/managers/configManager';

export const checkAuth = async (req: AppRequest, res: AppResponse, next: NextFunction, level: UserAccessLevel = UserAccessLevel.ADMIN): Promise<void> => {
    const noCheckPath = ['/login/reset'];
    if (!noCheckPath.includes(req.originalUrl)) {
        if (level === UserAccessLevel.NOBODY) {
            throw new StandardError('auth.checkAuth', 'UNAUTHORIZED', 'unauthorized', 'unauthorized action requested', 'unauthorized action requested');
        }
        if (level === UserAccessLevel.SCHEDULE) {
            checkScheduleAuth(req, res, next);
        } else {
            if (level !== UserAccessLevel.VISITOR) {
                const token = (req.headers['authorization'] ?? '').replace('Bearer ', '');
                await AdminManager.checkAccess(token);

                const isNotRevoked = await AdminManager.checkRevoke(req.cookies['refresh'] || '');
                if (!isNotRevoked) {
                    await AdminManager.clearSession();
                    res.clearCookie('refresh');
                    res.clearCookie('proxy');
                    res.clearCookie(configManager.getConfig.APP_NAME);
                    throw new StandardError('adminManager.checkRefresh', 'UNAUTHORIZED', 'invalid_session', `Session provided is invalid`, 'Session provided is invalid');
                }

                // check if proxy user after generic auth checks
                // Rewrite the Ses, and save real UID to Ses.ProxyUID
                if (req.cookies.proxy) {
                    void (await AdminManager.checkProxy(req.cookies.proxy));
                }

                if (Ses.AccessLevel < level) {
                    throw new StandardError('auth.checkAuth', 'UNAUTHORIZED', 'unauthorized', 'unauthorized action requested', 'unauthorized action requested');
                }
            }
        }
        next();
    } else {
        next();
    }
};

export const checkScheduleAuth = (req: AppRequest, _res: AppResponse, next: NextFunction): void => {
    const providedSecret = req.headers['x-api-secret'];
    if (!providedSecret) {
        throw new StandardError('checkAuth', 'UNAUTHORIZED', 'unauthorized', 'no credentials provided', 'no credentials provided');
    }
    if (providedSecret !== configManager.getConfig.SCHEDULER_SECRET) {
        throw new StandardError('checkAuth', 'UNAUTHORIZED', 'invalid_cred', 'credentials provided invalid', `credentials provided invalid`);
    }
    next();
};
