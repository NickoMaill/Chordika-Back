import { PerformanceState } from '~/core/class/Performance';
import { AccessLevelValue } from '~/core/controllerBase';

export type SessionShape = {
    userEmail: string | null;
    UID: number | null;
    proxyUID: number | null;
    needMfa: boolean;
    userFirstName: string | null;
    userLastName: string | null;
    userName: string | null;
    userAccess: AccessLevelValue;
    userMobile: string | null;
    deviceId: string | null;
    hlsToken: string | null;
    perf: PerformanceState;
    perfActive: boolean;
};
declare module 'express-session' {
    interface SessionData {
        ipAddress: string;
        perfUID: string;
        ses: SessionShape;
        [key: string]: any;
    }
}
declare global {
    namespace Express {
        export interface Request {
            perfUID?: string;
        }
    }
}
